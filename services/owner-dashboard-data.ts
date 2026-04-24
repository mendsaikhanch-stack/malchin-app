// Owner dashboard-ийн data layer (pure).
//
// Статус (2026-04-24): Locked decision (CLAUDE.md §3) — Owner/Admin нь
// WEB-ONLY. Энэ файлд mobile route нэмэхгүй. Data layer зөвхөн pure —
// веб front-end ирэхэд шууд ашиглагдана, mobile bundle-д import хийсэн ч
// тойрог буцна (side effect үгүй).
//
// Locked 8 хэсэг (CLAUDE.md §4):
//   Growth · Revenue · Product usage · Geography · Organizations ·
//   Payments & billing · Moderation & trust · Content operations
//
// Single-glance асуулт (§4):
//   Хэн? Хаанаас? Яаж? Хэн төлж? Аль модуль үнэтэй? Аль сум идэвхтэй?
//
// Backend endpoint санал (backend-gaps.md-д нэмэх):
//   GET /owner/snapshot → OwnerSnapshot
//   GET /owner/growth, /owner/revenue, ... (хэсэг тус бүр хайлттай)

import type { PackageId } from './pricing';

// ---------------------------------------------------------------------
// 1. Growth
// ---------------------------------------------------------------------

export type GrowthSnapshot = {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  newThisWeek: number;
  retention7d: number; // 0..100
};

// ---------------------------------------------------------------------
// 2. Revenue
// ---------------------------------------------------------------------

export type RevenueSnapshot = {
  mrr: number; // MNT
  byPackage: Partial<Record<PackageId, number>>;
  activeSubscribers: number;
  churnedThisMonth: number;
};

// ---------------------------------------------------------------------
// 3. Product usage
// ---------------------------------------------------------------------

export type ProductUsageSnapshot = {
  featureCounts: Record<string, number>; // feature key → 7 хоногийн хэрэглээ
  topFeature: string;
  dauPerFeature: Record<string, number>; // unique users per feature
};

// ---------------------------------------------------------------------
// 4. Geography
// ---------------------------------------------------------------------

export type AimagStat = {
  aimag: string;
  users: number;
  active: number;
};

export type GeoSnapshot = {
  byAimag: AimagStat[];
  topAimag: string;
  coveragePct: number; // байршилтай хэрэглэгчийн %
};

// ---------------------------------------------------------------------
// 5. Organizations
// ---------------------------------------------------------------------

export type OrgSnapshot = {
  coopCount: number;
  sumLicenseCount: number;
  providerCount: number;
  activeOrgs: number;
};

// ---------------------------------------------------------------------
// 6. Payments & billing
// ---------------------------------------------------------------------

export type BillingSnapshot = {
  digitalRevenue: number; // in-app store (QPay/card) — MNT
  invoiceRevenue: number; // B2G — MNT
  pendingInvoices: number;
  dunningUsers: number; // failed recurring payments
};

// ---------------------------------------------------------------------
// 7. Moderation & trust
// ---------------------------------------------------------------------

export type ModerationSnapshot = {
  openReports: number;
  resolvedThisWeek: number;
  blockedUsers: number;
  verifiedUsers: number;
};

// ---------------------------------------------------------------------
// 8. Content operations
// ---------------------------------------------------------------------

export type ContentOpsSnapshot = {
  draft: number;
  inReview: number;
  published: number;
  archived: number;
  avgReviewHours: number;
};

// ---------------------------------------------------------------------
// Aggregate snapshot
// ---------------------------------------------------------------------

export type OwnerSnapshot = {
  asOf: string; // ISO timestamp
  growth: GrowthSnapshot;
  revenue: RevenueSnapshot;
  productUsage: ProductUsageSnapshot;
  geography: GeoSnapshot;
  organizations: OrgSnapshot;
  billing: BillingSnapshot;
  moderation: ModerationSnapshot;
  contentOps: ContentOpsSnapshot;
};

// ---------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------

export function topAimagOf(stats: AimagStat[]): string {
  if (stats.length === 0) return '';
  return stats.reduce((top, cur) => (cur.users > top.users ? cur : top)).aimag;
}

export function totalRevenue(rev: RevenueSnapshot): number {
  return Object.values(rev.byPackage).reduce<number>(
    (s, v) => s + (v ?? 0),
    0
  );
}

export function totalBillingRevenue(b: BillingSnapshot): number {
  return b.digitalRevenue + b.invoiceRevenue;
}

export function totalContentPipeline(c: ContentOpsSnapshot): number {
  return c.draft + c.inReview + c.published + c.archived;
}

export function healthyMrr(rev: RevenueSnapshot): boolean {
  // Churn > active-ийн 10% бол alarm — pure rule
  if (rev.activeSubscribers === 0) return false;
  return rev.churnedThisMonth / rev.activeSubscribers < 0.1;
}

export function engagementRate(g: GrowthSnapshot): number {
  if (g.totalUsers === 0) return 0;
  return Math.round((g.activeThisWeek / g.totalUsers) * 100);
}

// Геогpaphic coverage — бүх geo sum
export function totalUsersByGeo(geo: GeoSnapshot): number {
  return geo.byAimag.reduce((s, a) => s + a.users, 0);
}

// Single-glance digest — 6 locked асуулт (§4) дахь key answer
export type SingleGlanceDigest = {
  who: number; // нийт хэрэглэгч
  whereTop: string; // хамгийн идэвхтэй аймаг
  how: string; // хамгийн их ашигладаг feature
  whoPaysActive: number; // идэвхтэй subscriber
  topRevenuePackage: PackageId | null;
  topActiveSum: string; // одоогийн scope-д aimag level
};

export function singleGlanceDigest(snap: OwnerSnapshot): SingleGlanceDigest {
  let topPkg: PackageId | null = null;
  let topRev = -1;
  for (const [k, v] of Object.entries(snap.revenue.byPackage)) {
    if ((v ?? 0) > topRev) {
      topRev = v ?? 0;
      topPkg = k as PackageId;
    }
  }
  return {
    who: snap.growth.totalUsers,
    whereTop: snap.geography.topAimag,
    how: snap.productUsage.topFeature,
    whoPaysActive: snap.revenue.activeSubscribers,
    topRevenuePackage: topPkg,
    topActiveSum: snap.geography.topAimag,
  };
}

// ---------------------------------------------------------------------
// Mock provider + swap point
// ---------------------------------------------------------------------

export function getMockOwnerSnapshot(): OwnerSnapshot {
  const byAimag: AimagStat[] = [
    { aimag: 'Төв', users: 840, active: 612 },
    { aimag: 'Сэлэнгэ', users: 510, active: 380 },
    { aimag: 'Архангай', users: 790, active: 540 },
    { aimag: 'Хэнтий', users: 620, active: 470 },
    { aimag: 'Дорнод', users: 450, active: 290 },
    { aimag: 'Өвөрхангай', users: 560, active: 390 },
  ];
  const totalUsers = byAimag.reduce((s, a) => s + a.users, 0);

  const featureCounts: Record<string, number> = {
    home_feed: 14200,
    weather: 9800,
    advisory: 4200,
    lost_found: 1850,
    market_listings: 3600,
    bag_dashboard: 340,
    sum_dashboard: 62,
    wisdom_feed: 2100,
  };

  return {
    asOf: '2026-04-24T10:00:00+08:00',
    growth: {
      totalUsers,
      activeToday: 1820,
      activeThisWeek: 2681,
      newThisWeek: 145,
      retention7d: 64,
    },
    revenue: {
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
    },
    productUsage: {
      featureCounts,
      topFeature: 'home_feed',
      dauPerFeature: {
        home_feed: 1820,
        weather: 1510,
        advisory: 820,
        lost_found: 310,
        market_listings: 640,
        bag_dashboard: 42,
        sum_dashboard: 11,
        wisdom_feed: 390,
      },
    },
    geography: {
      byAimag,
      topAimag: topAimagOf(byAimag),
      coveragePct: 92,
    },
    organizations: {
      coopCount: 14,
      sumLicenseCount: 3,
      providerCount: 26,
      activeOrgs: 37,
    },
    billing: {
      digitalRevenue: 3_100_000,
      invoiceRevenue: 1_100_000,
      pendingInvoices: 2,
      dunningUsers: 9,
    },
    moderation: {
      openReports: 12,
      resolvedThisWeek: 24,
      blockedUsers: 7,
      verifiedUsers: 218,
    },
    contentOps: {
      draft: 18,
      inReview: 9,
      published: 124,
      archived: 6,
      avgReviewHours: 14,
    },
  };
}

import { ownerApi } from './api';

// Backend → cache → mock fallback (contract frozen — backend-gaps.md §7).
// Mobile-д wiring-гүй (web-only locked) — энэ функц зөвхөн future web client
// болон data integrity test-д хэрэглэгдэнэ.
export async function fetchOwnerSnapshot(): Promise<OwnerSnapshot> {
  try {
    return await ownerApi.snapshot();
  } catch {
    return getMockOwnerSnapshot();
  }
}
