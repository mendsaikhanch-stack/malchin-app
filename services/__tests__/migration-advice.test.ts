import { getMigrationAdvice } from '../migration-advice';

describe('getMigrationAdvice — dzud override', () => {
  it('dzudRisk=high → otor, now, destination=otor', () => {
    const a = getMigrationAdvice({ month: 7, dzudRisk: 'high' });
    expect(a.action).toBe('otor');
    expect(a.urgency).toBe('now');
    expect(a.destination).toBe('otor');
    expect(a.reasons.length).toBeGreaterThan(0);
    expect(a.steps.length).toBeGreaterThan(0);
  });

  it('dzudRisk=high нь сараас үл хамаарч override хийнэ', () => {
    for (const month of [1, 4, 7, 10, 12]) {
      const a = getMigrationAdvice({ month, dzudRisk: 'high' });
      expect(a.action).toBe('otor');
    }
  });

  it('dzudRisk=medium үед otor хийгдэхгүй — сарын дагуу урсана', () => {
    const a = getMigrationAdvice({ month: 7, dzudRisk: 'medium' });
    expect(a.action).not.toBe('otor');
  });
});

describe('getMigrationAdvice — улирлаар', () => {
  it('3-р сар → хаваржаа бэлтгэл (prepare, soon)', () => {
    const a = getMigrationAdvice({ month: 3 });
    expect(a.action).toBe('prepare');
    expect(a.destination).toBe('spring');
    expect(a.urgency).toBe('soon');
  });

  it('4-р сар → хаваржаа руу нүүх (move, now)', () => {
    const a = getMigrationAdvice({ month: 4 });
    expect(a.action).toBe('move');
    expect(a.destination).toBe('spring');
  });

  it('5-р сар + pastureCondition=good → зусланд бэлдэх (prepare)', () => {
    const a = getMigrationAdvice({ month: 5, pastureCondition: 'good' });
    expect(a.action).toBe('prepare');
    expect(a.destination).toBe('summer');
  });

  it('5-р сар + pastureCondition=poor → зусланд одоо нүүх (move)', () => {
    const a = getMigrationAdvice({ month: 5, pastureCondition: 'poor' });
    expect(a.action).toBe('move');
    expect(a.urgency).toBe('now');
  });

  it('6-р сар мөн зуны bucket-т', () => {
    const a = getMigrationAdvice({ month: 6 });
    expect(a.destination).toBe('summer');
  });

  it('7-р сар → бэлчээр ээлжлэх (stay)', () => {
    const a = getMigrationAdvice({ month: 7 });
    expect(a.action).toBe('stay');
    expect(a.title).toMatch(/ээлж/);
  });

  it('8-р сар мөн "ээлжлэх" bucket', () => {
    const a = getMigrationAdvice({ month: 8 });
    expect(a.action).toBe('stay');
  });

  it('9-р сар → намаржаа бэлтгэл (prepare)', () => {
    const a = getMigrationAdvice({ month: 9 });
    expect(a.action).toBe('prepare');
    expect(a.destination).toBe('autumn');
  });

  it('10-р сар → намаржаа руу нүүх (move, now)', () => {
    const a = getMigrationAdvice({ month: 10 });
    expect(a.action).toBe('move');
    expect(a.urgency).toBe('now');
    expect(a.destination).toBe('autumn');
  });

  it('11-р сар → өвөлжөө руу нүүх (move, now)', () => {
    const a = getMigrationAdvice({ month: 11 });
    expect(a.action).toBe('move');
    expect(a.destination).toBe('winter');
  });
});

describe('getMigrationAdvice — өвөл', () => {
  it('1-р сар + weatherTemp=-35 → нүүхгүй (stay)', () => {
    const a = getMigrationAdvice({ month: 1, weatherTemp: -35 });
    expect(a.action).toBe('stay');
    expect(a.urgency).toBe('now');
    expect(a.title).toMatch(/Нүүхгүй|байрандаа/i);
  });

  it('12-р сар + weatherTemp=-20 → өвөлжөөндөө байх (later)', () => {
    const a = getMigrationAdvice({ month: 12, weatherTemp: -20 });
    expect(a.action).toBe('stay');
    expect(a.urgency).toBe('later');
  });

  it('2-р сар (өвөл bucket)', () => {
    const a = getMigrationAdvice({ month: 2 });
    expect(a.action).toBe('stay');
  });
});

describe('getMigrationAdvice — хэлбэр', () => {
  it('action нь зөвшөөрөгдсөн 4-н утгын нэг', () => {
    for (let m = 1; m <= 12; m++) {
      const a = getMigrationAdvice({ month: m });
      expect(['move', 'prepare', 'stay', 'otor']).toContain(a.action);
    }
  });

  it('urgency нь зөвшөөрөгдсөн 3-н утгын нэг', () => {
    for (let m = 1; m <= 12; m++) {
      const a = getMigrationAdvice({ month: m });
      expect(['now', 'soon', 'later']).toContain(a.urgency);
    }
  });

  it('reasons, steps — array, empty биш', () => {
    const a = getMigrationAdvice({ month: 4 });
    expect(Array.isArray(a.reasons)).toBe(true);
    expect(Array.isArray(a.steps)).toBe(true);
    expect(a.reasons.length).toBeGreaterThan(0);
    expect(a.steps.length).toBeGreaterThan(0);
  });
});
