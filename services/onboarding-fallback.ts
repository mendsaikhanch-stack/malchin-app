// Онбординг-аас AsyncStorage-д хадгалсан data-г parse + backend format руу хөрвүүлэх
// pure функцүүд. Backend унасан үед профайл/нүүр эдгээрийг fallback болгож ашиглана.
//
// Эдгээр нь зөвхөн JSON string-ээр ажилладаг — AsyncStorage-тай холбогдохгүй
// (тиймээс unit test хийх боломжтой).

export type OnboardingSnapshot = {
  phone?: string;
  otpVerified?: boolean;
  lastName?: string;
  firstName?: string;
  role?: string;
  aimag?: string;
  sum?: string;
  bag?: string;
  seasonal?: Record<string, { lat?: number; lng?: number; note?: string }>;
  livestock?: {
    horse?: number;
    cow?: number;
    sheep?: number;
    goat?: number;
    camel?: number;
  };
  preferences?: Record<string, boolean>;
};

export type LivestockStats = {
  livestock: Array<{ animal_type: string; total_count: number }>;
  total_animals: number;
};

export type UserFallback = {
  phone: string;
  name: string;
  aimag: string;
  sum: string;
  bag: string;
  role: string;
};

// Raw JSON string (AsyncStorage-ын гаралт) → typed snapshot эсвэл null
export function parseOnboardingSnapshot(
  raw: string | null | undefined
): OnboardingSnapshot | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    return d as OnboardingSnapshot;
  } catch {
    return null;
  }
}

// Онбординг дата → backend livestockApi.getStats() format
export function toLivestockStats(
  snapshot: OnboardingSnapshot | null
): LivestockStats | null {
  if (!snapshot?.livestock) return null;
  const types = ['horse', 'cow', 'sheep', 'goat', 'camel'] as const;
  const items = types
    .filter((t) => (snapshot.livestock?.[t] ?? 0) > 0)
    .map((t) => ({
      animal_type: t,
      total_count: snapshot.livestock![t]!,
    }));
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.total_count, 0);
  return { livestock: items, total_animals: total };
}

// Онбординг дата → профайл таб-ын user object fallback
export function toUserFallback(
  snapshot: OnboardingSnapshot | null
): UserFallback | null {
  if (!snapshot?.phone) return null;
  const fullName = `${snapshot.lastName || ''} ${snapshot.firstName || ''}`.trim();
  return {
    phone: snapshot.phone,
    name: fullName,
    aimag: snapshot.aimag || '',
    sum: snapshot.sum || '',
    bag: snapshot.bag || '',
    role: snapshot.role || 'malchin',
  };
}

// Login-д дугаар тулгаж нэвтэрнэ (backend унасан үеийн fallback)
export function matchUserFallbackByPhone(
  snapshot: OnboardingSnapshot | null,
  phone: string
): UserFallback | null {
  if (!snapshot?.phone || snapshot.phone !== phone) return null;
  return toUserFallback(snapshot);
}
