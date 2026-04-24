// Feature-тусгай quota / cap (pure).
//
// Энэ файл нь "free багц дээр advisory 3/сар" гэх мэт limited feature-ийн
// бодит тоогоор эвалюация хийнэ. Storage layer (AsyncStorage) нь `hooks/
// use-quota.ts`-д хамаарна — энэ файл зөвхөн pure rule.
//
// Дизайн:
//   1. Limit бүр `{ feature, limit, period }`-тай
//   2. `period = 'month'` → timestamp жагсаалтыг одоогийн хуанлийн сарын
//      доторх тоогоор тоолно
//   3. `period = 'active'` → идэвхтэй item тоогоор (caller тоолно)
//   4. `hasUnlimitedVariant()` — тухайн limited feature-ийн premium
//      variant байгаа эсэх + багц хандах эрхтэй эсэх
//
// Locked: MVP #14 "Package/pricing/billing basic" → free cap 3/сар advisory.

import { canAccess, type FeatureKey, type PackageId } from './pricing';

export type QuotaPeriod = 'month' | 'active';

export type QuotaConfig = {
  feature: FeatureKey;
  limit: number;
  period: QuotaPeriod;
};

// Limited feature тус бүрийн cap (pricing.ts-тэй нийцтэй)
export const QUOTA_LIMITS: Partial<Record<FeatureKey, QuotaConfig>> = {
  advisory_limited: {
    feature: 'advisory_limited',
    limit: 3,
    period: 'month',
  },
  listings_create_basic: {
    feature: 'listings_create_basic',
    limit: 3,
    period: 'active',
  },
};

// Limited → Unlimited feature mapping
// (free-ийн limited-ыг premium-ийн unlimited-тай харгалзуулна)
export const UNLIMITED_VARIANT: Partial<Record<FeatureKey, FeatureKey>> = {
  advisory_limited: 'advisory_unlimited',
  listings_create_basic: 'listings_create_unlimited',
};

// Одоогийн хуанлийн сарын timestamp-ууд (ms) тоолно.
export function countThisMonth(timestamps: number[], now = Date.now()): number {
  const ref = new Date(now);
  const month = ref.getMonth();
  const year = ref.getFullYear();
  return timestamps.filter((t) => {
    const d = new Date(t);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
}

// Багц нь unlimited variant-ын эрх эзэмшдэг эсэх
export function hasUnlimitedVariant(
  feature: FeatureKey,
  pkg: PackageId
): boolean {
  const variant = UNLIMITED_VARIANT[feature];
  return variant ? canAccess(pkg, variant) : false;
}

export type QuotaStatus = {
  allowed: boolean;
  used: number;
  limit: number; // Infinity хэрэв unlimited
  remaining: number; // Infinity хэрэв unlimited
  unlimited: boolean;
};

// Pure эвалюация — quota хэтэрсэн эсэх, үлдсэн тоо.
export function evaluateQuota(
  feature: FeatureKey,
  used: number,
  unlimited: boolean
): QuotaStatus {
  if (unlimited) {
    return {
      allowed: true,
      used,
      limit: Infinity,
      remaining: Infinity,
      unlimited: true,
    };
  }
  const cfg = QUOTA_LIMITS[feature];
  if (!cfg) {
    // Тохиргоогүй feature — free гэж үзнэ
    return {
      allowed: true,
      used,
      limit: Infinity,
      remaining: Infinity,
      unlimited: true,
    };
  }
  const remaining = Math.max(0, cfg.limit - used);
  return {
    allowed: used < cfg.limit,
    used,
    limit: cfg.limit,
    remaining,
    unlimited: false,
  };
}

// Хүрэх дөхсөн (remaining == 1 || 0) эсэхийг warning banner-т ашигла.
export function isNearCap(status: QuotaStatus): boolean {
  if (status.unlimited) return false;
  return status.remaining <= 1;
}
