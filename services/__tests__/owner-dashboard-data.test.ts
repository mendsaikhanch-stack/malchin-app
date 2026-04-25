import {
  topAimagOf,
  totalRevenue,
  totalBillingRevenue,
  totalContentPipeline,
  healthyMrr,
  engagementRate,
  totalUsersByGeo,
  singleGlanceDigest,
  getMockOwnerSnapshot,
  churnRatePct,
  dunningRatePct,
  moderationResolutionRate,
  coverageGapPct,
  contentReviewBacklogHours,
  healthAlarms,
  fetchOwnerSnapshot,
  type AimagStat,
  type RevenueSnapshot,
  type BillingSnapshot,
  type ContentOpsSnapshot,
  type GrowthSnapshot,
  type ModerationSnapshot,
  type GeoSnapshot,
  type OwnerSnapshot,
} from '../owner-dashboard-data';

// fetchOwnerSnapshot тестэд ownerApi.snapshot mock хийнэ.
// (top-level mock — owner-dashboard-data.ts-д late-import-ээр ашигладаг ч
// jest.mock hoist хийх тул асуудалгүй.)
jest.mock('../api', () => ({
  ownerApi: { snapshot: jest.fn() },
}));
import { ownerApi } from '../api';
const mockSnapshot = ownerApi.snapshot as jest.MockedFunction<typeof ownerApi.snapshot>;

describe('owner-dashboard / topAimagOf', () => {
  it('хоосон жагсаалтад хоосон string буцаана', () => {
    expect(topAimagOf([])).toBe('');
  });

  it('хамгийн олон хэрэглэгчтэй аймгийг буцаана', () => {
    const stats: AimagStat[] = [
      { aimag: 'Төв', users: 840, active: 612 },
      { aimag: 'Архангай', users: 790, active: 540 },
      { aimag: 'Сэлэнгэ', users: 510, active: 380 },
    ];
    expect(topAimagOf(stats)).toBe('Төв');
  });

  it('tie үед эхний тохирсоныг хадгална (stable)', () => {
    const stats: AimagStat[] = [
      { aimag: 'A', users: 100, active: 50 },
      { aimag: 'B', users: 100, active: 50 },
    ];
    expect(topAimagOf(stats)).toBe('A');
  });
});

describe('owner-dashboard / totalRevenue', () => {
  it('byPackage values-ын нийлбэрийг буцаана', () => {
    const rev: RevenueSnapshot = {
      mrr: 4_200_000,
      byPackage: {
        free: 0,
        premium_malchin: 2_800_000,
        cooperative: 600_000,
        sum_license: 500_000,
        verified_provider: 300_000,
      },
      activeSubscribers: 312,
      churnedThisMonth: 18,
    };
    expect(totalRevenue(rev)).toBe(4_200_000);
  });

  it('хоосон byPackage → 0', () => {
    const rev: RevenueSnapshot = {
      mrr: 0,
      byPackage: {},
      activeSubscribers: 0,
      churnedThisMonth: 0,
    };
    expect(totalRevenue(rev)).toBe(0);
  });
});

describe('owner-dashboard / totalBillingRevenue', () => {
  it('digital + invoice нийлбэр', () => {
    const b: BillingSnapshot = {
      digitalRevenue: 3_100_000,
      invoiceRevenue: 1_100_000,
      pendingInvoices: 2,
      dunningUsers: 9,
    };
    expect(totalBillingRevenue(b)).toBe(4_200_000);
  });
});

describe('owner-dashboard / totalContentPipeline', () => {
  it('4 төлөвийн нийлбэр', () => {
    const c: ContentOpsSnapshot = {
      draft: 18,
      inReview: 9,
      published: 124,
      archived: 6,
      avgReviewHours: 14,
    };
    expect(totalContentPipeline(c)).toBe(157);
  });
});

describe('owner-dashboard / healthyMrr', () => {
  it('churn 0% → healthy', () => {
    const rev: RevenueSnapshot = {
      mrr: 1000,
      byPackage: {},
      activeSubscribers: 100,
      churnedThisMonth: 0,
    };
    expect(healthyMrr(rev)).toBe(true);
  });

  it('churn 9% → healthy (threshold 10% хатуу бус)', () => {
    const rev: RevenueSnapshot = {
      mrr: 1000,
      byPackage: {},
      activeSubscribers: 100,
      churnedThisMonth: 9,
    };
    expect(healthyMrr(rev)).toBe(true);
  });

  it('churn 10% → alarm', () => {
    const rev: RevenueSnapshot = {
      mrr: 1000,
      byPackage: {},
      activeSubscribers: 100,
      churnedThisMonth: 10,
    };
    expect(healthyMrr(rev)).toBe(false);
  });

  it('subscriber 0 → unhealthy (баазгүй)', () => {
    const rev: RevenueSnapshot = {
      mrr: 0,
      byPackage: {},
      activeSubscribers: 0,
      churnedThisMonth: 0,
    };
    expect(healthyMrr(rev)).toBe(false);
  });
});

describe('owner-dashboard / engagementRate', () => {
  it('activeThisWeek/totalUsers-ийн 0..100%', () => {
    const g: GrowthSnapshot = {
      totalUsers: 3770,
      activeToday: 1820,
      activeThisWeek: 2681,
      newThisWeek: 145,
      retention7d: 64,
    };
    // 2681/3770 ≈ 71%
    expect(engagementRate(g)).toBe(71);
  });

  it('totalUsers 0 → 0', () => {
    const g: GrowthSnapshot = {
      totalUsers: 0,
      activeToday: 0,
      activeThisWeek: 0,
      newThisWeek: 0,
      retention7d: 0,
    };
    expect(engagementRate(g)).toBe(0);
  });
});

describe('owner-dashboard / totalUsersByGeo', () => {
  it('бүх аймгийн users-ийн нийлбэр', () => {
    const snap = getMockOwnerSnapshot();
    // 840 + 510 + 790 + 620 + 450 + 560 = 3770
    expect(totalUsersByGeo(snap.geography)).toBe(3770);
  });
});

describe('owner-dashboard / singleGlanceDigest', () => {
  it('6 locked асуултад хариулт буцаана', () => {
    const snap = getMockOwnerSnapshot();
    const d = singleGlanceDigest(snap);
    expect(d.who).toBe(3770);
    expect(d.whereTop).toBe('Төв'); // хамгийн олон — 840
    expect(d.how).toBe('home_feed');
    expect(d.whoPaysActive).toBe(312);
    expect(d.topRevenuePackage).toBe('premium_malchin'); // 2.8M хамгийн их
    expect(d.topActiveSum).toBe('Төв');
  });
});

describe('owner-dashboard / mock integrity', () => {
  const snap: OwnerSnapshot = getMockOwnerSnapshot();

  it('asOf нь ISO timestamp форматтай', () => {
    expect(snap.asOf).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('8 locked хэсэг бүрэн', () => {
    expect(snap.growth).toBeDefined();
    expect(snap.revenue).toBeDefined();
    expect(snap.productUsage).toBeDefined();
    expect(snap.geography).toBeDefined();
    expect(snap.organizations).toBeDefined();
    expect(snap.billing).toBeDefined();
    expect(snap.moderation).toBeDefined();
    expect(snap.contentOps).toBeDefined();
  });

  it('totalBillingRevenue === sum of byPackage (mock consistency)', () => {
    // Mock-д хоёр нь ижил 4.2M байхаар тохируулсан
    expect(totalBillingRevenue(snap.billing)).toBe(totalRevenue(snap.revenue));
  });

  it('mock churn rate healthy (< 10%)', () => {
    // 18/312 ≈ 5.8% — healthy
    expect(healthyMrr(snap.revenue)).toBe(true);
  });

  it('top feature нь productUsage.featureCounts-оор баталгаажсан', () => {
    const fc = snap.productUsage.featureCounts;
    const top = Object.entries(fc).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    expect(snap.productUsage.topFeature).toBe(top);
  });
});

describe('owner-dashboard / churnRatePct', () => {
  it('mock churn rate ≈ 6% (18/312)', () => {
    const snap = getMockOwnerSnapshot();
    expect(churnRatePct(snap.revenue)).toBe(6);
  });

  it('activeSubscribers 0 → 0', () => {
    const rev: RevenueSnapshot = {
      mrr: 0,
      byPackage: {},
      activeSubscribers: 0,
      churnedThisMonth: 5,
    };
    expect(churnRatePct(rev)).toBe(0);
  });

  it('100% churn (бүгд явсан)', () => {
    const rev: RevenueSnapshot = {
      mrr: 0,
      byPackage: {},
      activeSubscribers: 100,
      churnedThisMonth: 100,
    };
    expect(churnRatePct(rev)).toBe(100);
  });
});

describe('owner-dashboard / dunningRatePct', () => {
  it('mock dunning ≈ 3% (9/312)', () => {
    const snap = getMockOwnerSnapshot();
    expect(dunningRatePct(snap.billing, snap.revenue)).toBe(3);
  });

  it('activeSubscribers 0 → 0 (divide-by-zero guard)', () => {
    const billing: BillingSnapshot = {
      digitalRevenue: 0,
      invoiceRevenue: 0,
      pendingInvoices: 0,
      dunningUsers: 5,
    };
    const rev: RevenueSnapshot = {
      mrr: 0,
      byPackage: {},
      activeSubscribers: 0,
      churnedThisMonth: 0,
    };
    expect(dunningRatePct(billing, rev)).toBe(0);
  });
});

describe('owner-dashboard / moderationResolutionRate', () => {
  it('mock resolution rate ≈ 67% (24/(24+12))', () => {
    const snap = getMockOwnerSnapshot();
    expect(moderationResolutionRate(snap.moderation)).toBe(67);
  });

  it('open=0 + resolved=0 → 100% (mathematical edge)', () => {
    const m: ModerationSnapshot = {
      openReports: 0,
      resolvedThisWeek: 0,
      blockedUsers: 0,
      verifiedUsers: 0,
    };
    expect(moderationResolutionRate(m)).toBe(100);
  });

  it('бүгд open, resolved=0 → 0%', () => {
    const m: ModerationSnapshot = {
      openReports: 10,
      resolvedThisWeek: 0,
      blockedUsers: 0,
      verifiedUsers: 0,
    };
    expect(moderationResolutionRate(m)).toBe(0);
  });
});

describe('owner-dashboard / coverageGapPct', () => {
  it('mock gap === 8 (100 - 92)', () => {
    const snap = getMockOwnerSnapshot();
    expect(coverageGapPct(snap.geography)).toBe(8);
  });

  it('coverage > 100 → 0 (clamp)', () => {
    const geo: GeoSnapshot = {
      byAimag: [],
      topAimag: '',
      coveragePct: 105,
    };
    expect(coverageGapPct(geo)).toBe(0);
  });

  it('coverage 0 → 100', () => {
    const geo: GeoSnapshot = {
      byAimag: [],
      topAimag: '',
      coveragePct: 0,
    };
    expect(coverageGapPct(geo)).toBe(100);
  });
});

describe('owner-dashboard / contentReviewBacklogHours', () => {
  it('mock backlog === 126 (9 × 14)', () => {
    const snap = getMockOwnerSnapshot();
    expect(contentReviewBacklogHours(snap.contentOps)).toBe(126);
  });

  it('inReview 0 → 0', () => {
    const c: ContentOpsSnapshot = {
      draft: 0,
      inReview: 0,
      published: 0,
      archived: 0,
      avgReviewHours: 24,
    };
    expect(contentReviewBacklogHours(c)).toBe(0);
  });
});

describe('owner-dashboard / healthAlarms', () => {
  it('mock snapshot — alarm байхгүй (бүгд threshold-оос дор)', () => {
    const snap = getMockOwnerSnapshot();
    expect(healthAlarms(snap)).toEqual([]);
  });

  it('churn 10% → "churn" alarm', () => {
    const snap = getMockOwnerSnapshot();
    snap.revenue = { ...snap.revenue, churnedThisMonth: 32 }; // 32/312 ≈ 10.3%
    expect(healthAlarms(snap)).toContain('churn');
  });

  it('dunning 5% → "dunning" alarm', () => {
    const snap = getMockOwnerSnapshot();
    snap.billing = { ...snap.billing, dunningUsers: 16 }; // 16/312 ≈ 5.1%
    expect(healthAlarms(snap)).toContain('dunning');
  });

  it('moderation 50% resolution → "moderation" alarm', () => {
    const snap = getMockOwnerSnapshot();
    snap.moderation = { ...snap.moderation, openReports: 24, resolvedThisWeek: 24 };
    expect(healthAlarms(snap)).toContain('moderation');
  });

  it('coverage gap 25% → "coverage" alarm', () => {
    const snap = getMockOwnerSnapshot();
    snap.geography = { ...snap.geography, coveragePct: 75 };
    expect(healthAlarms(snap)).toContain('coverage');
  });

  it('review backlog ≥ 200 цаг → "review_backlog" alarm', () => {
    const snap = getMockOwnerSnapshot();
    snap.contentOps = { ...snap.contentOps, inReview: 20, avgReviewHours: 12 }; // 240
    expect(healthAlarms(snap)).toContain('review_backlog');
  });

  it('бүх 5 threshold давсан → 5 alarm бүгд буцаана', () => {
    const snap = getMockOwnerSnapshot();
    snap.revenue = { ...snap.revenue, churnedThisMonth: 50 };
    snap.billing = { ...snap.billing, dunningUsers: 30 };
    snap.moderation = { ...snap.moderation, openReports: 100, resolvedThisWeek: 5 };
    snap.geography = { ...snap.geography, coveragePct: 50 };
    snap.contentOps = { ...snap.contentOps, inReview: 30, avgReviewHours: 20 };
    expect(healthAlarms(snap).sort()).toEqual(
      ['churn', 'coverage', 'dunning', 'moderation', 'review_backlog'].sort()
    );
  });
});

describe('owner-dashboard / fetchOwnerSnapshot real→mock fallback', () => {
  beforeEach(() => {
    mockSnapshot.mockReset();
  });

  it('ownerApi.snapshot амжилттай → backend response буцаана', async () => {
    const fake = getMockOwnerSnapshot();
    fake.asOf = '2099-01-01T00:00:00+08:00'; // mock-аас ялгарах
    mockSnapshot.mockResolvedValue(fake);

    const result = await fetchOwnerSnapshot();
    expect(result.asOf).toBe('2099-01-01T00:00:00+08:00');
    expect(mockSnapshot).toHaveBeenCalledTimes(1);
  });

  it('ownerApi.snapshot reject → mock-руу fallback', async () => {
    mockSnapshot.mockRejectedValue(new Error('backend down'));

    const result = await fetchOwnerSnapshot();
    // Mock-ийн baseline shape бүрэн (8 section)
    expect(result.growth).toBeDefined();
    expect(result.revenue).toBeDefined();
    expect(result.geography.topAimag).toBe('Төв');
  });
});
