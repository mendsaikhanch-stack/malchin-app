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
  type AimagStat,
  type RevenueSnapshot,
  type BillingSnapshot,
  type ContentOpsSnapshot,
  type GrowthSnapshot,
  type OwnerSnapshot,
} from '../owner-dashboard-data';

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
