# Weather Provider Reference — Malchin App

Production-д шилжихэд цаг агаарын мэдээг хэрхэн хангахыг шийдэхэд
зориулсан provider харьцуулалт. MVP-д одоогоор OpenWeatherMap ашиглаж
байгаа ч launch-ын үед sum-түвшний нарийвчлалд шилжих боломжтой.

Эх сурвалж: 2026-04 байдлаар үнэ, API шинж чанарууд (шинэчлэлтээр өөрчлөгдөх боломжтой).

---

## 1. Нарийвчлалын ангилал

| Түвшин | Грид-ийн хэмжээ | Малчны хувьд утга |
|---|---|---|
| **Aimag-level** (~50–100 км) | Улсын дундаж | "Ерөнхий мэдээ". Отор/нүүдэлд зөвшөөрч болно, бэлчээр-түвшний шийдвэрт хангалтгүй. |
| **Sum-level** (~10–25 км) | Суманд байршсан станцтай | Малчин хонь үхрээ өнөөдөр гарах/эсэхийг шийдэхэд хангалттай. |
| **Бэлчээр-level** (~1–5 км) | GPS цэгийн нарийвчлал | Отор-ийн маршрут, усны эх, зудын өндөрт-хамааралтай мэдээ. |
| **Hyper-local** (<1 км) | Ozon, radar-combined | Цаг тутмын эрсдэл (салхи, бороо). Малын эрүүл мэндэд хэрэглэж болно. |

---

## 2. Provider харьцуулалт

### A. ҮНЭГҮЙ / бага нарийвчлалтай

| Provider | Нарийвчлал | Free ашиг | Аргументууд |
|---|---|---|---|
| **Open-Meteo** | ~1–11 км (ERA5 + GFS) | ✅ БҮХЭЛДЭЭ FREE, ямар ч auth-гүй | **MVP-д хамгийн зөв** сонголт. Монголын бүх аймаг/сумыг шууд GPS-ээр дамжуулан татна. Commercial use зөвшөөрдөг. Uptime ~99.9%. |
| **OpenWeatherMap** | ~13 км (GFS-based) | 1000/өдөр free | Одоо ашиглаж буй. Паржиналь нарийвчлал Монголд саарал. API key шаардлагатай. |
| **NOAA NWS / GFS** | ~13 км | ✅ FREE | АНУ-ын govt, Монголын station-гүй тул зөвхөн model-output. Raw grib → хөрвүүлэх төвөгтэй. |

### B. ДУНД нарийвчлалтай — жил бүрд $1–3K

| Provider | Нарийвчлал | Үнэ (ойролцоо) | Аргументууд |
|---|---|---|---|
| **Visual Crossing** | ~4 км, history 1970- | $35/сар (1M records) | Сайн docs, малын туршилтанд ашиглаж буй. Historical weather нь зудын forecast-д шаардлагатай. |
| **Tomorrow.io** | ~1 км (blend), 15-day | $65/сар (25K/өдөр) | Hyper-local radar, pollen, AQI. Малчны эрсдэлд зориулсан insight нэмэлт. |
| **WeatherAPI.com** | ~5 км, 14-day | $35/сар (Business) | Хямдхан, MN language. Free 1M/сар хангалттай эхэн үед. |

### C. ӨНДӨР нарийвчлалтай — жил бүрд $10K+

| Provider | Нарийвчлал | Үнэ (ойролцоо) | Аргументууд |
|---|---|---|---|
| **Meteomatics** | ~90м grid (!!) | ~$1,000/сар enterprise | Sum-level-ээс ч нарийн. Норвегийн ECMWF HRES-ээс direct pipe. Zud forecast-д идеал. |
| **Tomorrow.io Enterprise** | Radar-fused 500м | $2–5K/сар | On-premise option. Алерт rule-based. |
| **IBM Weather (The Weather Company)** | Global, 500м | Enterprise NDA ~$20K+ | Хамгийн том commercial, Монголын branch байхгүй. |

### D. МОНГОЛ-ДОТООД (B2G)

| Provider | Нарийвчлал | Холбоос | Тайлбар |
|---|---|---|---|
| **НАМЕМ** (Цаг уурын газар) | Station-level бодит | Direct agreement needed | Хамгийн эрх бүхий Монгол мэдээ. 120+ станц. Official data license шаардана — B2G invoice процесс. |
| **Tsag Agaar Open Data** | 24 цагийн forecast | tsag-agaar.gov.mn | Web-д нээлттэй, API биш. Scrape эсвэл partnership. |
| **МИАТ / Монгол телевиз forecast** | Хэлбэржүүлсэн | — | Шууд API-гүй, content partnership хэрэгтэй. |

---

## 3. Санал болгож буй phased approach

### Phase 0 — MVP launch (одоо)
- **Open-Meteo** шилжүүлэх (OpenWeatherMap-аас). FREE + commercial-зөвшөөрөл.
- Grid ~1-11 км → малчин анх "сумын цаг агаар" гэж мэдрэх түвшин.
- Implementation: `services/openmeteo-client.ts` — одоогийн `openweather-client.ts`-ийн pattern-ийн дагуу.
- API: `GET https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=temperature_2m,...&daily=...&timezone=Asia/Ulaanbaatar`

### Phase 1 — 10K+ active users (launch + 3–6 сар)
- **Open-Meteo + Visual Crossing historical blend**. Historical-оор зудын indicator-ыг илүү баттай тооцоолно.
- Cost: Visual Crossing $35–70/сар.

### Phase 2 — B2G / засаг захиргааны custmer гарч ирэх үед
- **НАМЕМ agreement** эхлүүлэх. Аймаг бүрийн сумын лиценз (CLAUDE.md §4 Pricing) дээр НАМЕМ data-г нэмэх цэгт болгох.
- Parallel: **Meteomatics** hyper-local зайлшгүй (sum-level grid alert-д).
- Cost: НАМЕМ ≈ MNT 15–25M/жил (гэрээний дагуу), Meteomatics ≈ $12K/жил.

---

## 4. Хэрэгжүүлэх зам (connect-ready)

MVP code одоо backend `/weather/by-aimag?aimag=X` endpoint ашиглаж байна (`services/api.ts` → `weatherApi.getByAimag`). Backend унасан үед client-side `openweather-client.ts` fallback болдог.

Production-д шилжих үед:
1. **Backend-д** `/weather/by-location?lat=X&lng=Y` endpoint нэмэх (sum-level accepted).
2. **Client-д** `weatherApi.getByLocation(lat, lng)` method — `mongolia-geo.getSumsByAimag` дотор хадгалсан GPS-ийг ашиглана.
3. `weather.tsx`-ийн `loadWeather` нь:
   - Хэрэглэгчийн байршил GPS байвал → `getByLocation(lat, lng)`
   - Эсвэл selected aimag/sum-аас GPS-ийг `mongolia-geo`-оос авч → `getByLocation(...)`
4. Provider swap: backend-ийн `/weather/*` handler-ийг Open-Meteo → Visual Crossing → НАМЕМ руу дараалан шилжүүлнэ.

Client код өөрчлөгдөхгүй — зөвхөн **backend provider swap**. Энэ нь contract-freeze-ийн гол давуу тал.

---

## 5. Зардлын тооцоо (10K DAU-д үндэслэн)

| Provider | Жилийн зардал (USD) | Notes |
|---|---|---|
| Open-Meteo | **$0** | Unlimited commercial. MVP-д зайлшгүй эхлэл. |
| Visual Crossing Business | ~$420 | 1M record/сар, blend-д хангалттай. |
| Tomorrow.io Business | ~$780 | Hyper-local alert-д. |
| НАМЕМ partnership | ~$5,000–8,000 (MNT 15–25M) | B2G. Сумын лиценз revenue-оос өглөг. |
| Meteomatics Enterprise | ~$12,000 | Phase 2+, бэлчээр-level. |

**Нийт Phase 0**: $0 (Open-Meteo-оор эхэлж болно, API key ч шаардаагүй).

---

## 6. Хэзээ хэрэгтэй?

- **Одоо (MVP)**: Open-Meteo шилжүүлэх. Одоогийн OpenWeatherMap-ийг фоллбэк болгон хадгалж болно.
- **Users > 1000**: Visual Crossing blend эхлүүлэх.
- **Сумын лиценз B2G гэрээ хийсний дараа**: НАМЕМ data agreement эхлүүлэх.
- **Зудын эрсдэл автомат SMS alert нэмэх үед**: Meteomatics эсвэл Tomorrow.io enterprise.

Бэлэн болсон зүйлс:
- ✅ `services/mongolia-geo.ts` — 374 сум GPS-тэй, provider-ийг lat/lng-ээр шууд дуудах боломжтой.
- ✅ `services/openweather-client.ts` — pattern бэлэн, Open-Meteo руу шилжүүлэхэд ~1 цаг.
- ✅ `services/offline-ttl.ts` — TTL cache бэлэн, 6-12 цагийн shelf life weather-д.
- ✅ Contract-freeze: `weatherApi` namespace тогтворжсон, backend swap-ад client өөрчлөхгүй.
