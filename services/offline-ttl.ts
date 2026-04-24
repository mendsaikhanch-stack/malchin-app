// Offline cache-ийн TTL тогтоол + pure helper функцүүд.
// AsyncStorage-аас гадуур unit test хийх зориулалттай.
//
// TTL-ийн цаг нь content-ийн шинэхэн байх шаардлагаар шийдвэрлэгдэнэ:
// - Эрсдэлийн мэдээлэл (weather, alerts) → богино (5–15 мин)
// - Зах зээл/зар → дунд (15–30 мин)
// - Лавлах мэдээлэл (knowledge, diseases) → урт (өдөр/долоо хоног)

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const CACHE_TTL: Record<string, number> = {
  // Яаралтай / өөрчлөгддөг мэдээлэл (богино TTL)
  weather: 15 * MINUTE,      // Цаг агаар — малчинд шаардлагатай бол шинэ (30→15)
  alerts: 15 * MINUTE,       // Сэрэмжлүүлэг — эрсдэл үед шинэ (60→15)
  market: 15 * MINUTE,       // Зах зээлийн зар (шинэ)
  news: 30 * MINUTE,         // Сумын мэдэгдэл (120→30)
  ads: 30 * MINUTE,          // Сурталчилгаа (60→30)

  // Дунд (1–2 цаг)
  prices: 1 * HOUR,          // Үнийн товч (120→60)
  banks: 1 * HOUR,           // Банкны ханш
  reminders: 1 * HOUR,       // Сануулга (шинэ)
  insurance: 2 * HOUR,       // Даатгал, ЭМД/НД тооцоо (шинэ)

  // Урт (12–24 цаг) — тогтмол бодит мэдээлэл
  breeding: 12 * HOUR,
  health: 12 * HOUR,
  programs: 12 * HOUR,
  livestock: 24 * HOUR,
  animals: 24 * HOUR,
  pastures: 24 * HOUR,

  // Маш урт (өдөр/долоо хоног) — лавлах мэдээлэл
  knowledge: 7 * DAY,
  diseases: 30 * DAY,

  // Default (тодорхойгүй категори)
  default: 1 * HOUR,
};

export type CacheEntry = {
  data: any;
  timestamp: number;
  key: string;
};

// Category-ын TTL-г буцаана; тодорхойгүй бол default
export function resolveTtl(category?: string): number {
  if (!category) return CACHE_TTL.default;
  return CACHE_TTL[category] ?? CACHE_TTL.default;
}

// Entry-ний хугацаа дууссан эсэхийг шалгана
export function isExpired(
  entry: Pick<CacheEntry, 'timestamp'>,
  ttl: number,
  now: number = Date.now()
): boolean {
  return now - entry.timestamp > ttl;
}

// Тухайн category нь богино/дунд/урт аль нь вэ (analytics/UI-д ашиглана)
export type TtlBand = 'short' | 'medium' | 'long' | 'very_long';

export function ttlBand(ms: number): TtlBand {
  if (ms <= 30 * MINUTE) return 'short';
  if (ms <= 2 * HOUR) return 'medium';
  if (ms <= 24 * HOUR) return 'long';
  return 'very_long';
}
