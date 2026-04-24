import {
  CACHE_TTL,
  resolveTtl,
  isExpired,
  ttlBand,
} from '../offline-ttl';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('resolveTtl', () => {
  it('тодорхойгүй category → default', () => {
    expect(resolveTtl()).toBe(CACHE_TTL.default);
    expect(resolveTtl(undefined)).toBe(CACHE_TTL.default);
    expect(resolveTtl('xyz-unknown')).toBe(CACHE_TTL.default);
  });

  it('weather → 15 мин (малчинд шинэ байх ёстой)', () => {
    expect(resolveTtl('weather')).toBe(15 * MIN);
  });

  it('alerts → 15 мин (эрсдэл яаралтай)', () => {
    expect(resolveTtl('alerts')).toBe(15 * MIN);
  });

  it('market → 15 мин (зар байнга нэмэгддэг, өмнө default байсан)', () => {
    expect(resolveTtl('market')).toBe(15 * MIN);
  });

  it('news → 30 мин (сумын мэдэгдэл, өмнө 2 цаг байсан)', () => {
    expect(resolveTtl('news')).toBe(30 * MIN);
  });

  it('insurance → 2 цаг (өмнө default байсан)', () => {
    expect(resolveTtl('insurance')).toBe(2 * HOUR);
  });

  it('reminders → 1 цаг (шинэ категори)', () => {
    expect(resolveTtl('reminders')).toBe(HOUR);
  });

  it('knowledge → 7 өдөр', () => {
    expect(resolveTtl('knowledge')).toBe(7 * DAY);
  });

  it('diseases → 30 өдөр (хамгийн урт)', () => {
    expect(resolveTtl('diseases')).toBe(30 * DAY);
  });

  it('livestock → 1 өдөр', () => {
    expect(resolveTtl('livestock')).toBe(DAY);
  });
});

describe('isExpired', () => {
  it('саяхан cache → expired биш', () => {
    const now = 10_000_000;
    const entry = { timestamp: now - 5 * MIN };
    expect(isExpired(entry, 15 * MIN, now)).toBe(false);
  });

  it('яг TTL хугацаатай → expired биш (жижиг шалгалт)', () => {
    const now = 10_000_000;
    const entry = { timestamp: now - 15 * MIN };
    expect(isExpired(entry, 15 * MIN, now)).toBe(false);
  });

  it('TTL + 1ms давсан → expired', () => {
    const now = 10_000_000;
    const entry = { timestamp: now - 15 * MIN - 1 };
    expect(isExpired(entry, 15 * MIN, now)).toBe(true);
  });

  it('маш хуучин entry → expired', () => {
    const now = 10_000_000;
    const entry = { timestamp: now - 48 * HOUR };
    expect(isExpired(entry, DAY, now)).toBe(true);
  });
});

describe('ttlBand', () => {
  it('богино: ≤ 30 мин (weather/alerts/market)', () => {
    expect(ttlBand(15 * MIN)).toBe('short');
    expect(ttlBand(30 * MIN)).toBe('short');
  });

  it('дунд: ≤ 2 цаг (prices/insurance/reminders)', () => {
    expect(ttlBand(HOUR)).toBe('medium');
    expect(ttlBand(2 * HOUR)).toBe('medium');
  });

  it('урт: ≤ 24 цаг (livestock/animals/pastures)', () => {
    expect(ttlBand(12 * HOUR)).toBe('long');
    expect(ttlBand(DAY)).toBe('long');
  });

  it('маш урт: > 24 цаг (knowledge/diseases)', () => {
    expect(ttlBand(7 * DAY)).toBe('very_long');
    expect(ttlBand(30 * DAY)).toBe('very_long');
  });
});

describe('TTL policy coverage — api.ts-д ашиглагддаг бүх category', () => {
  // api.ts-ийн cachedRequest дуудлагад харгалзах category-ууд
  const usedCategories = [
    'livestock',
    'weather',
    'alerts',
    'prices',
    'news',
    'banks',
    'knowledge',
    'diseases',
    'insurance',
    'market',
    'ads',
    'default',
  ];

  it('api.ts ашиглагддаг бүх category тодорхой TTL-тэй (regression: insurance/market default байхгүй)', () => {
    for (const cat of usedCategories) {
      expect(CACHE_TTL[cat]).toBeGreaterThan(0);
    }
  });
});
