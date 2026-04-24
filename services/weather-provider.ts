// Weather provider adapter (pure).
//
// ШИЙДВЭР (2026-04-24):
// =====================
// Primary: Backend api.malchin.mn → /weather/{aimag}. Backend нь дараа дараагийн
// провайдерыг нэгтгэж, dzud_risk тооцоолол нэмэж, аймаг/сум түвшинд нэгтгэнэ.
//
// Backend дотор ашиглагдах provider (таамаг — backend team баталгаажуулах):
// 1. Цаг агаарын үндсэн агентлаг (tsag-agaar.gov.mn) — албан ёсны Монголын эх үүсвэр.
//    Pro: Зөв Монголын засаг захиргааны нэгж, зудын шинжилгээ.
//    Con: API стандарт бага тогтвортой, rate limit тодорхой бус.
// 2. OpenWeather (api.openweathermap.org) — глобал, тогтвортой.
//    Pro: Reliable, well-documented, 1M calls/month free.
//    Con: Нутгийн онцлог (зуд) шууд байхгүй — backend-д тооцоолох хэрэгтэй.
//
// Санал: Primary = Met Mongolia, Fallback = OpenWeather (backend-ийн дотор).
// Client side зөвхөн backend-тэй ярьж, backend унасан үед cache-аас уншина.
//
// Энэ файлын үүрэг: API shape-ийг нэг normalizedшейп руу буулгах, condition/dzud
// текстийг Монгол руу орчуулах. Backend-ийн contract өөрчлөгдөхөд энд нэг л
// газар засагдана.

export type WeatherConditionKey =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'fog'
  | 'thunder'
  | 'unknown';

export type DzudRisk = 'low' | 'medium' | 'high' | 'unknown';

export type NormalizedWeather = {
  aimag: string;
  temp: number | null;              // °C
  condition: WeatherConditionKey;
  conditionRaw: string;             // провайдерын raw condition string (debug/log-д)
  conditionLabel: string;           // Монгол хэл дээр ("Цэлмэг", "Бороотой", гэх мэт)
  dzudRisk: DzudRisk;
  dzudLabel: string;                // "Өндөр" | "Дунд" | "Бага" | "—"
  humidity?: number;
  windSpeed?: number;               // м/с
  provider: 'backend' | 'openweather' | 'met-mongolia' | 'unknown';
};

const CONDITION_LABELS: Record<WeatherConditionKey, string> = {
  clear: 'Цэлмэг',
  cloudy: 'Үүлэрхэг',
  rain: 'Бороотой',
  snow: 'Цастай',
  wind: 'Салхитай',
  fog: 'Манантай',
  thunder: 'Аянгатай',
  unknown: '—',
};

const DZUD_LABELS: Record<DzudRisk, string> = {
  low: 'Бага',
  medium: 'Дунд',
  high: 'Өндөр',
  unknown: '—',
};

// Raw condition text (any source) → normalized key
export function parseConditionKey(raw: string | undefined | null): WeatherConditionKey {
  const c = (raw || '').toLowerCase();
  if (!c) return 'unknown';
  if (c.includes('thunder') || c.includes('аянга')) return 'thunder';
  if (c.includes('fog') || c.includes('манан')) return 'fog';
  if (c.includes('snow') || c.includes('цас')) return 'snow';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('бороо')) return 'rain';
  if (c.includes('wind') || c.includes('салхи')) return 'wind';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('үүл')) return 'cloudy';
  if (c.includes('clear') || c.includes('sunny') || c.includes('цэлмэг')) return 'clear';
  return 'unknown';
}

export function conditionLabel(key: WeatherConditionKey): string {
  return CONDITION_LABELS[key];
}

export function dzudLabel(risk: DzudRisk): string {
  return DZUD_LABELS[risk];
}

export function parseDzudRisk(raw: unknown): DzudRisk {
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  if (typeof raw === 'number') {
    if (raw >= 0.66) return 'high';
    if (raw >= 0.33) return 'medium';
    if (raw >= 0) return 'low';
  }
  return 'unknown';
}

// Backend shape (одоогийн api.malchin.mn) → normalized
// Backend response: { aimag, temp, condition, dzud_risk, humidity?, wind_speed? }
export function normalizeBackendWeather(raw: any): NormalizedWeather {
  if (!raw || typeof raw !== 'object') {
    return emptyWeather('backend');
  }
  const condKey = parseConditionKey(raw.condition);
  const risk = parseDzudRisk(raw.dzud_risk);
  return {
    aimag: String(raw.aimag || ''),
    temp: typeof raw.temp === 'number' ? raw.temp : null,
    condition: condKey,
    conditionRaw: String(raw.condition || ''),
    conditionLabel: conditionLabel(condKey),
    dzudRisk: risk,
    dzudLabel: dzudLabel(risk),
    humidity: typeof raw.humidity === 'number' ? raw.humidity : undefined,
    windSpeed: typeof raw.wind_speed === 'number' ? raw.wind_speed : undefined,
    provider: 'backend',
  };
}

// OpenWeather shape (api.openweathermap.org/data/2.5/weather) → normalized
// Future use: backend унасан үеийн fallback. API key шаардлагатай.
export function normalizeOpenWeather(raw: any, aimag: string): NormalizedWeather {
  if (!raw || typeof raw !== 'object') return emptyWeather('openweather');
  const main = raw.weather?.[0]?.main || '';
  const condKey = parseConditionKey(main);
  const risk = computeDzudFromMetrics(
    typeof raw.main?.temp === 'number' ? raw.main.temp : null,
    typeof raw.wind?.speed === 'number' ? raw.wind.speed : null
  );
  return {
    aimag,
    temp: typeof raw.main?.temp === 'number' ? raw.main.temp : null,
    condition: condKey,
    conditionRaw: String(main),
    conditionLabel: conditionLabel(condKey),
    // OpenWeather нь зуд risk шууд өгдөггүй — температур + салхиар heuristic
    dzudRisk: risk,
    dzudLabel: dzudLabel(risk),
    humidity: typeof raw.main?.humidity === 'number' ? raw.main.humidity : undefined,
    windSpeed: typeof raw.wind?.speed === 'number' ? raw.wind.speed : undefined,
    provider: 'openweather',
  };
}

// Heuristic: extreme cold + wind → өндөр зудын эрсдэл
export function computeDzudFromMetrics(
  temp: number | null,
  windSpeed: number | null
): DzudRisk {
  if (temp === null) return 'unknown';
  if (temp <= -30) return 'high';
  if (temp <= -25 && (windSpeed ?? 0) > 10) return 'high';
  if (temp <= -25) return 'medium';
  if (temp <= -15 && (windSpeed ?? 0) > 15) return 'medium';
  return 'low';
}

export function emptyWeather(
  provider: NormalizedWeather['provider']
): NormalizedWeather {
  return {
    aimag: '',
    temp: null,
    condition: 'unknown',
    conditionRaw: '',
    conditionLabel: conditionLabel('unknown'),
    dzudRisk: 'unknown',
    dzudLabel: dzudLabel('unknown'),
    provider,
  };
}

// UI-д ашиглагдах өнгөний хэв маяг (danger/warning/success-ийг caller сонгоно)
export function dzudSeverityScore(risk: DzudRisk): 0 | 1 | 2 {
  if (risk === 'high') return 2;
  if (risk === 'medium') return 1;
  return 0;
}
