// Pricing package + feature gating (pure).
//
// Статус (2026-04-24): MVP #14 "Package/pricing/billing basic + offline sync".
// Энэ файл нь package → feature mapping-ийн pure эх сурвалж. UI gating
// хараахан wired биш — `canAccess()`-ийг дараагийн step-д route guard ба
// profile toggle-д холбоно.
//
// Locked: CLAUDE.md §4 Pricing (5 багц) + Billing (2 урсгал).
//   A. Digital (in-app)   — QPay/card, auto-renewal (in-app store дүрэм ЗӨВХӨН энд)
//   B. Org/real-world     — invoice, manual activation (web admin)

// ---------------------------------------------------------------------
// Package registry
// ---------------------------------------------------------------------

export type PackageId =
  | 'free'
  | 'premium_malchin'
  | 'cooperative'
  | 'sum_license'
  | 'verified_provider';

export type BillingStream = 'digital' | 'invoice';

export type PackageMeta = {
  id: PackageId;
  name: string;          // Mongolian display name
  billing: BillingStream;
  // tier нь upgrade comparison-д зориулсан (higher = илүү эрх), ГЭХДЭЭ
  // cooperative/sum_license/verified_provider нь Premium-тэй ortho-гональ
  // — tier biased comparison хийхдээ болгоомжтой. Ihenh feature matrix
  // дээр explicit package list ашиглана.
  tier: number;
};

export const PACKAGES: Record<PackageId, PackageMeta> = {
  free: {
    id: 'free',
    name: 'Үнэгүй',
    billing: 'digital',
    tier: 0,
  },
  premium_malchin: {
    id: 'premium_malchin',
    name: 'Премиум Малчин',
    billing: 'digital',
    tier: 1,
  },
  cooperative: {
    id: 'cooperative',
    name: 'Хоршооны багц',
    billing: 'invoice',
    tier: 2,
  },
  sum_license: {
    id: 'sum_license',
    name: 'Сумын лиценз',
    billing: 'invoice',
    tier: 3,
  },
  verified_provider: {
    id: 'verified_provider',
    name: 'Баталгаажсан үйлчилгээ үзүүлэгч',
    billing: 'digital',
    tier: 2,
  },
};

export function packageMeta(pkg: PackageId): PackageMeta {
  return PACKAGES[pkg];
}

// ---------------------------------------------------------------------
// Feature keys
// ---------------------------------------------------------------------

export type FeatureKey =
  // Advisory
  | 'advisory_limited'         // free: 3/сар, premium: unlimited
  | 'advisory_unlimited'
  // Weather
  | 'weather_basic'            // бүх багц — 3 өдрийн прогноз
  | 'weather_extended'         // premium+: 14 өдөр + NDVI layer
  // Dashboards
  | 'bag_dashboard_basic'      // free (role gate bag_darga)
  | 'sum_dashboard_basic'      // free (role gate sum_admin) — MVP #12
  | 'sum_dashboard_full'       // sum_license: heatmap, export, advanced
  // Marketplace
  | 'lost_found_view'          // бүх багц
  | 'lost_found_create'        // бүх багц (verified user required)
  | 'listings_view'            // бүх багц
  | 'listings_create_basic'    // free: 3 идэвхтэй зар
  | 'listings_create_unlimited'// premium+
  // Cooperative
  | 'coop_commerce'            // cooperative: bulk listing, member pricing
  | 'coop_seat_management'     // cooperative
  // Verified provider
  | 'provider_profile'         // verified_provider
  | 'provider_booking'         // verified_provider
  | 'provider_commission'      // verified_provider (payout pipeline)
  // Offline sync
  | 'offline_sync_basic'       // бүх багц
  | 'offline_sync_bulk';       // premium+ (advisory history, market bulk)

// Feature matrix: feature → аль багцуудад available.
// Role-based access (bag_darga → bag dashboard) нь тусдаа — энэ матриц
// зөвхөн PACKAGE gating-ийг хийнэ.
const FEATURE_MATRIX: Record<FeatureKey, PackageId[]> = {
  advisory_limited: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  advisory_unlimited: ['premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],

  weather_basic: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  weather_extended: ['premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],

  bag_dashboard_basic: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  sum_dashboard_basic: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  sum_dashboard_full: ['sum_license'],

  lost_found_view: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  lost_found_create: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  listings_view: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  listings_create_basic: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  listings_create_unlimited: ['premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],

  coop_commerce: ['cooperative'],
  coop_seat_management: ['cooperative'],

  provider_profile: ['verified_provider'],
  provider_booking: ['verified_provider'],
  provider_commission: ['verified_provider'],

  offline_sync_basic: ['free', 'premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
  offline_sync_bulk: ['premium_malchin', 'cooperative', 'sum_license', 'verified_provider'],
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export function canAccess(pkg: PackageId, feature: FeatureKey): boolean {
  return FEATURE_MATRIX[feature].includes(pkg);
}

export function requiredPackages(feature: FeatureKey): PackageId[] {
  return [...FEATURE_MATRIX[feature]];
}

// Feature-г хамгийн хямдхан нээх багцыг олох (upgrade CTA-д ашиглана).
// Tier нь partial order тул cooperative/sum_license/verified_provider
// хоорондоо ortho-гональ — энд bilinear биш бодит "хамгийн хямд" гэвэл
// free → premium_malchin gradient хардаг. Зөвхөн premium/free-г судалж,
// бусад org багцыг tier-ийн дарааллаар буцаана.
export function cheapestUpgrade(feature: FeatureKey): PackageId | null {
  const allowed = FEATURE_MATRIX[feature];
  if (allowed.includes('free')) return null; // free-ээр нээлттэй
  // Энгийн хэрэглэгч premium_malchin-ыг сонирхдог
  if (allowed.includes('premium_malchin')) return 'premium_malchin';
  // Org-only feature — tier-ийн дарааллаар (хамгийн бага tier)
  const sorted = [...allowed].sort(
    (a, b) => PACKAGES[a].tier - PACKAGES[b].tier
  );
  return sorted[0] ?? null;
}

// Billing stream-ээр шүүлт (UI-д "энэ багц QPay-р шууд" vs "invoice
// шаарддаг" мессеж харуулахад).
export function billingStreamFor(pkg: PackageId): BillingStream {
  return PACKAGES[pkg].billing;
}

// Package-ийн бүх feature-ийг буцаах (pricing page rendering-д хэрэг).
export function featuresOfPackage(pkg: PackageId): FeatureKey[] {
  return (Object.keys(FEATURE_MATRIX) as FeatureKey[]).filter((f) =>
    FEATURE_MATRIX[f].includes(pkg)
  );
}
