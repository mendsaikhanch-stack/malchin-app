import {
  getSeasonKeyForDate,
  hasCoords,
  getCurrentSeasonalCamp,
} from '../use-seasonal';

describe('getSeasonKeyForDate', () => {
  it('Өвөл: 12, 1, 2 сар', () => {
    expect(getSeasonKeyForDate(new Date(2026, 11, 15))).toBe('winter'); // 12-р сар
    expect(getSeasonKeyForDate(new Date(2026, 0, 15))).toBe('winter');  // 1-р сар
    expect(getSeasonKeyForDate(new Date(2026, 1, 15))).toBe('winter');  // 2-р сар
  });

  it('Хавар: 3, 4, 5 сар', () => {
    expect(getSeasonKeyForDate(new Date(2026, 2, 15))).toBe('spring');
    expect(getSeasonKeyForDate(new Date(2026, 3, 15))).toBe('spring');
    expect(getSeasonKeyForDate(new Date(2026, 4, 15))).toBe('spring');
  });

  it('Зун: 6, 7, 8 сар', () => {
    expect(getSeasonKeyForDate(new Date(2026, 5, 15))).toBe('summer');
    expect(getSeasonKeyForDate(new Date(2026, 6, 15))).toBe('summer');
    expect(getSeasonKeyForDate(new Date(2026, 7, 15))).toBe('summer');
  });

  it('Намар: 9, 10, 11 сар', () => {
    expect(getSeasonKeyForDate(new Date(2026, 8, 15))).toBe('autumn');
    expect(getSeasonKeyForDate(new Date(2026, 9, 15))).toBe('autumn');
    expect(getSeasonKeyForDate(new Date(2026, 10, 15))).toBe('autumn');
  });
});

describe('hasCoords', () => {
  it('lat + lng байвал true', () => {
    expect(hasCoords({ lat: 47.9, lng: 106.9 })).toBe(true);
  });
  it('зөвхөн lat байвал false', () => {
    expect(hasCoords({ lat: 47.9 })).toBe(false);
  });
  it('хоосон объект false', () => {
    expect(hasCoords({})).toBe(false);
  });
  it('undefined false', () => {
    expect(hasCoords(undefined)).toBe(false);
  });
  it('note-той боловч lat/lng-гүй false', () => {
    expect(hasCoords({ note: 'Их тохой' })).toBe(false);
  });
});

describe('getCurrentSeasonalCamp', () => {
  const seasonal = {
    winter: { lat: 47.9, lng: 106.9, note: 'Өвөлжөө' },
    spring: {},
    summer: { lat: 48.0, lng: 107.0 },
    autumn: { note: 'Намар орчим' },
    otor: {},
  };

  it('өвөл үед winter camp-ыг буцаана, registered=true', () => {
    const r = getCurrentSeasonalCamp(seasonal, new Date(2026, 0, 10));
    expect(r.key).toBe('winter');
    expect(r.label).toBe('Өвөлжөө');
    expect(r.registered).toBe(true);
    expect(r.camp.lat).toBe(47.9);
  });

  it('хавар үед spring camp хоосон байгаа тул registered=false', () => {
    const r = getCurrentSeasonalCamp(seasonal, new Date(2026, 3, 10));
    expect(r.key).toBe('spring');
    expect(r.registered).toBe(false);
  });

  it('зун үед summer camp GPS-тэй тул registered=true', () => {
    const r = getCurrentSeasonalCamp(seasonal, new Date(2026, 6, 10));
    expect(r.key).toBe('summer');
    expect(r.registered).toBe(true);
  });

  it('намар үед note байгаа ч GPS үгүй тул registered=false', () => {
    const r = getCurrentSeasonalCamp(seasonal, new Date(2026, 9, 10));
    expect(r.key).toBe('autumn');
    expect(r.registered).toBe(false);
  });
});
