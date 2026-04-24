// OpenWeather direct fetch fallback (pure + thin fetch wrapper).
//
// ЗОРИЛГО: Backend api.malchin.mn унасан + client cache-д мэдээлэл байхгүй
// үеийн яаралтай fallback. Зөвхөн цаг агаарт — өөр модулиудад хэрэглэхгүй
// (зуд risk, сумын мэдэгдэл гэх мэт backend-тусгай contract).
//
// API key: EXPO_PUBLIC_OPENWEATHER_API_KEY env variable-аас уншина.
// Key байхгүй үед fallback идэвхгүй — зөвхөн backend/cache-тэй ажиллана.

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export function getOpenWeatherApiKey(): string | null {
  const k = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  return k && k.length > 0 ? k : null;
}

export function isOpenWeatherAvailable(): boolean {
  return getOpenWeatherApiKey() !== null;
}

export function buildOpenWeatherUrl(
  coords: { lat: number; lng: number },
  apiKey: string,
  options?: { units?: 'metric' | 'imperial'; lang?: string }
): string {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lng),
    appid: apiKey,
    units: options?.units ?? 'metric',
    lang: options?.lang ?? 'mn',
  });
  return `${OPENWEATHER_BASE}/weather?${params.toString()}`;
}

// Hard timeout (backend-тэй ижил загвар) — сүлжээ удаан үед нэг удаа биш татна
const REQUEST_TIMEOUT_MS = 8000;

export async function fetchOpenWeather(
  coords: { lat: number; lng: number }
): Promise<any | null> {
  const apiKey = getOpenWeatherApiKey();
  if (!apiKey) return null;

  const url = buildOpenWeatherUrl(coords, apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
