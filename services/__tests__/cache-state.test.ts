import {
  getStaleState,
  staleTint,
  timeSince,
} from '../cache-state';

describe('getStaleState', () => {
  it('шинэ data (cache биш, offline биш) → badge үгүй', () => {
    const s = getStaleState({ fromCache: false, offline: false, expired: false });
    expect(s.show).toBe(false);
    expect(s.tone).toBe('fresh');
  });

  it('оффлайн → priority 1 offline badge', () => {
    const s = getStaleState({ fromCache: true, offline: true, expired: true });
    expect(s.show).toBe(true);
    expect(s.tone).toBe('offline');
    expect(s.label).toBe('Оффлайн');
  });

  it('cache-ээс, TTL давсан → "Хуучирсан"', () => {
    const s = getStaleState({ fromCache: true, offline: false, expired: true });
    expect(s.show).toBe(true);
    expect(s.tone).toBe('stale');
    expect(s.label).toBe('Хуучирсан');
  });

  it('cache-ээс, TTL дотор → fresh (badge үгүй)', () => {
    const s = getStaleState({ fromCache: true, offline: false, expired: false });
    expect(s.show).toBe(false);
  });

  it('offline priority > stale (хоёулаа байгаа үед offline ялна)', () => {
    const s = getStaleState({ fromCache: true, offline: true, expired: true });
    expect(s.tone).toBe('offline');
  });
});

describe('staleTint', () => {
  it('offline → danger red', () => {
    expect(staleTint('offline')).toBe('#B00020');
  });

  it('stale → warning orange', () => {
    expect(staleTint('stale')).toBe('#FF8F00');
  });

  it('fresh → success green', () => {
    expect(staleTint('fresh')).toBe('#2E7D32');
  });
});

describe('timeSince', () => {
  const now = 10_000_000_000;

  it('60 секундын дотор → "дөнгөж сая"', () => {
    expect(timeSince(now - 30_000, now)).toBe('дөнгөж сая');
  });

  it('1 минутаас дээш → "N минутын өмнө"', () => {
    expect(timeSince(now - 5 * 60_000, now)).toBe('5 минутын өмнө');
  });

  it('1 цагаас дээш → "N цагийн өмнө"', () => {
    expect(timeSince(now - 3 * 60 * 60_000, now)).toBe('3 цагийн өмнө');
  });

  it('1 өдрөөс дээш → "N өдрийн өмнө"', () => {
    expect(timeSince(now - 2 * 24 * 60 * 60_000, now)).toBe('2 өдрийн өмнө');
  });

  it('ирээдүй timestamp → "одоохон"', () => {
    expect(timeSince(now + 1000, now)).toBe('одоохон');
  });
});
