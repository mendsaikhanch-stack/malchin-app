import {
  parseBagId,
  slugifySum,
  bagDisplayLabel,
  DEFAULT_BAG_OPTIONS,
} from '../bag-id';

describe('parseBagId', () => {
  it('хоосон/null/undefined үед null', () => {
    expect(parseBagId('')).toBeNull();
    expect(parseBagId('   ')).toBeNull();
    expect(parseBagId(null)).toBeNull();
    expect(parseBagId(undefined)).toBeNull();
  });

  it('цэвэр тоо — "3" → "3"', () => {
    expect(parseBagId('3')).toBe('3');
    expect(parseBagId('7')).toBe('7');
    expect(parseBagId('10')).toBe('10');
  });

  it('тэг бүхий тоо — "05" → "5"', () => {
    expect(parseBagId('05')).toBe('5');
    expect(parseBagId('007')).toBe('7');
  });

  it('"N-р баг" форматыг таних', () => {
    expect(parseBagId('1-р баг')).toBe('1');
    expect(parseBagId('3-р баг')).toBe('3');
    expect(parseBagId('7-р Баг')).toBe('7');
    expect(parseBagId('10-р баг')).toBe('10');
  });

  it('dash/зай онцлогтой хувилбар', () => {
    expect(parseBagId('1р баг')).toBe('1');
    expect(parseBagId('3 -р баг')).toBe('3');
    expect(parseBagId('2–р баг')).toBe('2'); // en-dash
  });

  it('"Баг N" форматыг таних', () => {
    expect(parseBagId('Баг 3')).toBe('3');
    expect(parseBagId('баг 7')).toBe('7');
  });

  it('үгээр бичсэн тоог таних', () => {
    expect(parseBagId('нэгдүгээр баг')).toBe('1');
    expect(parseBagId('гуравдугаар баг')).toBe('3');
    expect(parseBagId('тавдугаар')).toBe('5');
    expect(parseBagId('арав')).toBe('10');
  });

  it('нэрлэсэн баг (custom label) — slug хэлбэрээр буцаана', () => {
    expect(parseBagId('Найрамдал')).toBe('найрамдал');
    expect(parseBagId('Шинэ бүрд')).toBe('шинэ-бүрд');
  });

  it('дугаарын эргэн тойронд whitespace', () => {
    expect(parseBagId('  3-р баг  ')).toBe('3');
    expect(parseBagId('\t7\n')).toBe('7');
  });
});

describe('slugifySum', () => {
  it('хоосон үед null', () => {
    expect(slugifySum('')).toBeNull();
    expect(slugifySum('   ')).toBeNull();
    expect(slugifySum(null)).toBeNull();
  });

  it('нэг үгтэй сум lowercase', () => {
    expect(slugifySum('Алтанбулаг')).toBe('алтанбулаг');
    expect(slugifySum('УЛААНБААТАР')).toBe('улаанбаатар');
  });

  it('олон үгтэй сум dash-аар холбоно', () => {
    expect(slugifySum('Сайхан овоо')).toBe('сайхан-овоо');
    expect(slugifySum('Төв   Сүх')).toBe('төв-сүх');
  });

  it('whitespace trim', () => {
    expect(slugifySum('  Баянзүрх  ')).toBe('баянзүрх');
  });
});

describe('bagDisplayLabel', () => {
  it('хоосон үед "—"', () => {
    expect(bagDisplayLabel('')).toBe('—');
    expect(bagDisplayLabel(null)).toBe('—');
    expect(bagDisplayLabel(undefined)).toBe('—');
  });

  it('numeric ID → "N-р баг"', () => {
    expect(bagDisplayLabel('3')).toBe('3-р баг');
    expect(bagDisplayLabel('1-р баг')).toBe('1-р баг');
    expect(bagDisplayLabel('гуравдугаар баг')).toBe('3-р баг');
    expect(bagDisplayLabel('Баг 5')).toBe('5-р баг');
  });

  it('custom нэртэй баг → хэвээр буцаана (trim)', () => {
    expect(bagDisplayLabel('Найрамдал')).toBe('Найрамдал');
    expect(bagDisplayLabel('  Шинэ бүрд  ')).toBe('Шинэ бүрд');
  });
});

describe('DEFAULT_BAG_OPTIONS', () => {
  it('7 сонголт агуулна (1-р – 7-р баг)', () => {
    expect(DEFAULT_BAG_OPTIONS).toHaveLength(7);
    expect(DEFAULT_BAG_OPTIONS[0]).toBe('1-р баг');
    expect(DEFAULT_BAG_OPTIONS[6]).toBe('7-р баг');
  });

  it('бүх сонголт parseBagId-ээр зөв дугаарт хөрвөнө', () => {
    DEFAULT_BAG_OPTIONS.forEach((opt, idx) => {
      expect(parseBagId(opt)).toBe(String(idx + 1));
    });
  });
});
