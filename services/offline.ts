import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_TTL,
  isExpired,
  resolveTtl,
  type CacheEntry,
} from './offline-ttl';

const CACHE_PREFIX = '@malchin_cache_';

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
    const ttl = resolveTtl(category);
    return { ...entry, expired: isExpired(entry, ttl) };
  } catch {
    return null;
  }
}

// Cache-тай API дуудлага
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  category?: string
): Promise<{ data: T; fromCache: boolean; offline: boolean; expired: boolean }> {
  try {
    // Онлайн - API дуудна, cache шинэчилнэ
    const data = await fetchFn();
    await cacheSet(key, data);
    return { data, fromCache: false, offline: false, expired: false };
  } catch (e) {
    // Оффлайн - cache-аас уншина
    const cached = await cacheGet(key, category);
    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        offline: true,
        expired: !!cached.expired,
      };
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
