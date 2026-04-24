// Token management + refresh logic.
//
// Architecture:
// - Access token: богино насны (1 цаг), API request бүрд ашиглагдана.
// - Refresh token: урт насны (30 хоног), зөвхөн /auth/refresh дуудахад.
// - 401 гарвал нэг удаа refresh оролдож, амжилттай бол анхны запросыг дахин явуулна.
// - Refresh ч amжилтгүй бол caller-д нэмэлт алдаа буцаана (UI logout хийнэ).
//
// Backend contract:
// - POST /auth/refresh  { refreshToken }  →  { token, refreshToken }
// - Эхний login/create response: { token, refreshToken, user, ... }

import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = '@malchin_token';
const REFRESH_KEY = '@malchin_refresh_token';

// Singleton in-memory cache — AsyncStorage hit хийхгүй зөвхөн нэг удаа уншина
let accessCache: string | null | undefined = undefined;
let refreshCache: string | null | undefined = undefined;

export async function getAccessToken(): Promise<string | null> {
  if (accessCache === undefined) {
    accessCache = await AsyncStorage.getItem(ACCESS_KEY);
  }
  return accessCache;
}

export async function getRefreshToken(): Promise<string | null> {
  if (refreshCache === undefined) {
    refreshCache = await AsyncStorage.getItem(REFRESH_KEY);
  }
  return refreshCache;
}

export async function setTokens(tokens: { access: string | null; refresh?: string | null }) {
  accessCache = tokens.access;
  if (tokens.access) {
    await AsyncStorage.setItem(ACCESS_KEY, tokens.access);
  } else {
    await AsyncStorage.removeItem(ACCESS_KEY);
  }
  if (tokens.refresh !== undefined) {
    refreshCache = tokens.refresh;
    if (tokens.refresh) {
      await AsyncStorage.setItem(REFRESH_KEY, tokens.refresh);
    } else {
      await AsyncStorage.removeItem(REFRESH_KEY);
    }
  }
}

export async function clearTokens() {
  accessCache = null;
  refreshCache = null;
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

// Refresh-ийн concurrent-safe guard. Олон request 401 болох үед нэг л refresh
// оролдоно, бусад нь ижил promise-ийг хүлээнэ.
let inflightRefresh: Promise<string | null> | null = null;

export async function refreshAccessToken(
  apiBase: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetchImpl(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.token) return null;
      await setTokens({ access: data.token, refresh: data.refreshToken ?? refresh });
      return data.token as string;
    } catch {
      return null;
    } finally {
      // Guard-ыг refresh дуусахаар цэвэрлэнэ — дараагийн 401-ийн үед дахин оролдоно
      setTimeout(() => { inflightRefresh = null; }, 0);
    }
  })();

  return inflightRefresh;
}

// Test helper — in-memory кэшийг дахин эхлүүлэх
export function __resetTokenCacheForTests() {
  accessCache = undefined;
  refreshCache = undefined;
  inflightRefresh = null;
}
