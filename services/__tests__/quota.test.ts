import {
  countThisMonth,
  evaluateQuota,
  hasUnlimitedVariant,
  isNearCap,
  QUOTA_LIMITS,
  UNLIMITED_VARIANT,
} from '../quota';

describe('quota / countThisMonth', () => {
  const APR = new Date('2026-04-15T10:00:00+08:00').getTime();

  it('тухайн сарын timestamp-ыг оруулна, өмнөх сарын биш', () => {
    const tsInsideMonth = new Date('2026-04-01T00:00:00').getTime();
    const tsBeforeMonth = new Date('2026-03-31T23:59:59').getTime();
    const tsAfterMonth = new Date('2026-05-01T00:00:00').getTime();
    expect(
      countThisMonth([tsInsideMonth, tsBeforeMonth, tsAfterMonth], APR)
    ).toBe(1);
  });

  it('хоосон жагсаалт → 0', () => {
    expect(countThisMonth([], APR)).toBe(0);
  });

  it('бүгд тухайн сарынх', () => {
    const t1 = new Date('2026-04-02').getTime();
    const t2 = new Date('2026-04-20').getTime();
    const t3 = new Date('2026-04-30').getTime();
    expect(countThisMonth([t1, t2, t3], APR)).toBe(3);
  });

  it('жилийн хил шалгана', () => {
    const lastYear = new Date('2025-04-15').getTime();
    const thisYear = new Date('2026-04-10').getTime();
    expect(countThisMonth([lastYear, thisYear], APR)).toBe(1);
  });
});

describe('quota / evaluateQuota', () => {
  it('unlimited=true → ямар ч used-д allowed', () => {
    const s = evaluateQuota('advisory_limited', 999, true);
    expect(s.allowed).toBe(true);
    expect(s.unlimited).toBe(true);
    expect(s.remaining).toBe(Infinity);
  });

  it('advisory_limited used=0/3 → allowed, remaining=3', () => {
    const s = evaluateQuota('advisory_limited', 0, false);
    expect(s.allowed).toBe(true);
    expect(s.limit).toBe(3);
    expect(s.remaining).toBe(3);
  });

  it('advisory_limited used=2/3 → allowed, remaining=1', () => {
    const s = evaluateQuota('advisory_limited', 2, false);
    expect(s.allowed).toBe(true);
    expect(s.remaining).toBe(1);
  });

  it('advisory_limited used=3/3 → denied', () => {
    const s = evaluateQuota('advisory_limited', 3, false);
    expect(s.allowed).toBe(false);
    expect(s.remaining).toBe(0);
  });

  it('used>limit (stale data) → remaining clamp to 0', () => {
    const s = evaluateQuota('advisory_limited', 5, false);
    expect(s.allowed).toBe(false);
    expect(s.remaining).toBe(0);
  });

  it('тохируулаагүй feature → unlimited гэж үзнэ', () => {
    const s = evaluateQuota('weather_basic', 1000, false);
    expect(s.allowed).toBe(true);
    expect(s.unlimited).toBe(true);
  });

  it('listings_create_basic active=3 → denied', () => {
    const s = evaluateQuota('listings_create_basic', 3, false);
    expect(s.allowed).toBe(false);
    expect(s.limit).toBe(3);
  });
});

describe('quota / hasUnlimitedVariant', () => {
  it('free багц advisory_limited → unlimited variant-д эрхгүй', () => {
    expect(hasUnlimitedVariant('advisory_limited', 'free')).toBe(false);
  });

  it('premium_malchin багц → advisory_unlimited variant-д эрхтэй', () => {
    expect(hasUnlimitedVariant('advisory_limited', 'premium_malchin')).toBe(true);
  });

  it('free багц listings_create_basic → variant алга', () => {
    expect(hasUnlimitedVariant('listings_create_basic', 'free')).toBe(false);
  });

  it('cooperative багц listings → unlimited variant', () => {
    expect(hasUnlimitedVariant('listings_create_basic', 'cooperative')).toBe(true);
  });

  it('variant mapping-гүй feature → false', () => {
    expect(hasUnlimitedVariant('weather_basic', 'free')).toBe(false);
  });
});

describe('quota / isNearCap', () => {
  it('unlimited → false', () => {
    const s = evaluateQuota('advisory_limited', 2, true);
    expect(isNearCap(s)).toBe(false);
  });

  it('remaining=2 → false (эрт хэлэхгүй)', () => {
    const s = evaluateQuota('advisory_limited', 1, false);
    expect(isNearCap(s)).toBe(false);
  });

  it('remaining=1 → near cap', () => {
    const s = evaluateQuota('advisory_limited', 2, false);
    expect(isNearCap(s)).toBe(true);
  });

  it('remaining=0 → near cap (хүрсэн)', () => {
    const s = evaluateQuota('advisory_limited', 3, false);
    expect(isNearCap(s)).toBe(true);
  });
});

describe('quota / config integrity', () => {
  it('QUOTA_LIMITS-ийн feature нь UNLIMITED_VARIANT-д variant-тай', () => {
    for (const feature of Object.keys(QUOTA_LIMITS)) {
      expect(UNLIMITED_VARIANT[feature as keyof typeof UNLIMITED_VARIANT]).toBeDefined();
    }
  });
});
