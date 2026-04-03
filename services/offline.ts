import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@malchin_cache_';
const CACHE_TTL: Record<string, number> = {
  // Хэр удаан хадгалах (миллисекунд)
  livestock: 24 * 60 * 60 * 1000,     // 1 өдөр
  weather: 30 * 60 * 1000,            // 30 минут
  alerts: 60 * 60 * 1000,             // 1 цаг
  prices: 2 * 60 * 60 * 1000,         // 2 цаг
  news: 2 * 60 * 60 * 1000,           // 2 цаг
  programs: 12 * 60 * 60 * 1000,      // 12 цаг
  banks: 60 * 60 * 1000,              // 1 цаг
  knowledge: 7 * 24 * 60 * 60 * 1000, // 7 өдөр
  shinjikh: 30 * 24 * 60 * 60 * 1000, // 30 өдөр
  funfacts: 30 * 24 * 60 * 60 * 1000, // 30 өдөр
  diseases: 30 * 24 * 60 * 60 * 1000, // 30 өдөр
  ads: 60 * 60 * 1000,                // 1 цаг
  animals: 24 * 60 * 60 * 1000,       // 1 өдөр
  breeding: 12 * 60 * 60 * 1000,      // 12 цаг
  health: 12 * 60 * 60 * 1000,        // 12 цаг
  pastures: 24 * 60 * 60 * 1000,      // 1 өдөр
  default: 60 * 60 * 1000,            // 1 цаг
};

type CacheEntry = {
  data: any;
  timestamp: number;
  key: string;
};

// Cache-д хадгалах
export async function cacheSet(key: string, data: any): Promise<void> {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now(), key };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // Silent fail
  }
}

// Cache-аас унших
export async function cacheGet(key: string, category?: string): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const ttl = CACHE_TTL[category || 'default'] || CACHE_TTL.default;
    if (Date.now() - entry.timestamp > ttl) {
      // Хугацаа дууссан ч оффлайн үед ашиглана
      return { ...entry, expired: true };
    }
    return { ...entry, expired: false };
  } catch (e) {
    return null;
  }
}

// Cache-тай API дуудлага
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  category?: string
): Promise<{ data: T; fromCache: boolean; offline: boolean }> {
  try {
    // Онлайн - API дуудна, cache шинэчилнэ
    const data = await fetchFn();
    await cacheSet(key, data);
    return { data, fromCache: false, offline: false };
  } catch (e) {
    // Оффлайн - cache-аас уншина
    const cached = await cacheGet(key, category);
    if (cached) {
      return { data: cached.data, fromCache: true, offline: true };
    }
    throw e; // Cache ч байхгүй
  }
}

// Бүх cache цэвэрлэх
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k: string) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (e) {
    // Silent fail
  }
}

// Cache-ийн хэмжээ
export async function getCacheSize(): Promise<{ count: number; keys: string[] }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k: string) => k.startsWith(CACHE_PREFIX));
    return { count: cacheKeys.length, keys: cacheKeys.map((k: string) => k.replace(CACHE_PREFIX, '')) };
  } catch {
    return { count: 0, keys: [] };
  }
}
