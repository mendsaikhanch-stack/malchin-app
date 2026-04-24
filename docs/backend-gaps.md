# Backend endpoint gaps

> **Статус (2026-04-24):** Client тал MVP-ийн бүх UI-г хэрэгжүүлэхийн тулд
> mock data + pure helper-тэй явж байна. Энэ баримт нь backend team-д
> зориулсан нэгтгэсэн жагсаалт — аль endpoint-ууд дутуу / гарцтай вэ гэдгийг
> priority-оор харуулна.
>
> **Contract freeze:** Priority-0 + §7 endpoint-ын typed client contract
> `services/api.ts`-д бэлэн — §8 хүснэгтэд. Data-layer fetch* функцүүд
> real→cache→mock fallback-тэй. Backend endpoint бодит бий болсны дараа
> client-д ямар ч өөрчлөлт шаардлагагүй.
>
> Backend: `api.malchin.mn` (REST, 40+ endpoint аль хэдийн бий).

---

## 1. Priority 0 — MVP-ийн хамгийн нэн шаардлагатай

### 1.1 Багийн даргын dashboard

Frontend: `app/bag-dashboard.tsx` + `services/bag-dashboard-data.ts`
Одоогоор: `fetchBagHouseholds()` mock буцаана (6 өрх). Backend endpoint үгүй.

**Шаардлагатай:**

```
GET  /households/bag/:bagId
     → Household[]
     Ш/Ө:  { id, head, phone, members, animals, location,
              lastActive: string, lastActiveDays: number,
              risk?: 'low'|'medium'|'high', otor: boolean }

GET  /households/bag/:bagId/stats
     → BagStats
     Ш/Ө:  { totalHouseholds, totalAnimals, totalRisky,
              totalOtor, totalActive, engagementPct,
              avgReadPct, lowReadBags, inactive7Days }

POST /households/bag/:bagId/broadcast
     Body: { title, body }
     → { recipients: number, sent_at: string }
```

Client-д risk/lastActiveDays хоёрыг дотооддоо тооцно (`computeHouseholdRisk`)
— backend-аас ирсэн hint илүү зөв бол `backendRiskHint` field-ээр дамжуулна.

---

### 1.2 Сумын удирдлагын dashboard

Frontend: `app/sum-dashboard.tsx` + `services/sum-dashboard-data.ts`
Одоогоор: `fetchSumBags` / `fetchSumEvents` mock (5 баг + 3 event).

**Шаардлагатай:**

```
GET  /sums/:sumId/bags
     → BagStat[]
     Ш/Ө:  { id, name, households, animals, active, risky, otor, readPct }

GET  /sums/:sumId/stats
     → Aggregated (client `computeSumStats` хийнэ, гэхдээ backend precomputed
       тооцоо илүү хурдан)

GET  /sums/:sumId/events
     → SumEvent[]
     Ш/Ө:  { id, title, date: 'YYYY-MM-DD', participation: number }

POST /sums/:sumId/broadcast
     Body: { title, body, scope: 'all' | <bagId> }
     → { recipients: number, sent_at: string }
```

---

### 1.3 Алдсан / Олдсон мал (Lost/Found)

Frontend: `app/lost-found.tsx` + `services/lost-found-data.ts`
Одоогоор: `fetchLostFoundListings` mock (3 listing).

**Сонголт A — dedicated endpoint-ууд (санал)**:

```
GET  /lost-found?type=lost|found&aimag=X&sum=Y
     → Listing[]

POST /lost-found
     Body: Listing (validation client-ээр хийгдсэн)
     → { id, status: 'pending', ... }

PUT  /lost-found/:id/resolve
     → { status: 'resolved' }

POST /lost-found/:id/report
     Body: { reason }
     → { reported: true }
```

**Сонголт B — marketApi дахин ашиглах**:
`marketApi.getAll({ category: 'lost_animal' | 'found_animal' })` ба create-т
ижил. Хялбар боловч UX онцлог (reward, earTag lookup, match suggestion)-д
тусдаа endpoint илүү цэвэр.

**Бонус endpoint:**
```
GET  /lost-found/:id/matches
     → PotentialMatch[]  (backend-аас offline match engine)
     Client-ийн `findPotentialMatches` одоогоор client-side — хэмжээ
     томрох үед backend side хурдан болно.
```

---

## 2. Priority 1 — Stale-while-revalidate + weather

### 2.1 Weather provider (backend дотор)

Frontend: `services/weather-provider.ts` (normalization layer бэлэн).
Одоогийн backend: `/weather/{aimag}` → `{ aimag, temp, condition, dzud_risk, humidity?, wind_speed? }`

**Санал:**
- Primary source: **Met Mongolia** (tsag-agaar.gov.mn) — албан эх үүсвэр, зуд
  эрсдэл тооцоолол бодит.
- Fallback: **OpenWeather** (api.openweathermap.org) — Met Mongolia унасан
  үеийн backup.
- Backend нь хоёуланг cache хийж, 15 мин TTL-тэй хадгална (client бас TTL-тэй
  — `offline-ttl.ts` weather 15 мин).

**Response shape (одоогийн харьцангуй стабиль):**
```json
{
  "aimag": "Төв",
  "temp": -18,
  "condition": "Snow",            // ENG эсвэл Монгол (client парс хийнэ)
  "dzud_risk": "medium",          // 'low'|'medium'|'high' эсвэл 0..1
  "humidity": 70,
  "wind_speed": 8
}
```

---

### 2.2 Stale-while-revalidate metadata

Client-ийн `cachedRequestWithMeta` 3 мэдээлэл хэрэгтэй: `fromCache`, `offline`,
`expired`. Эхний 2-ыг client-д харагдна (response ирэх эсэх). `expired`-ийг
client TTL config-оор шалгадаг.

**Backend-ийн сонголт** (Phase 2-д нэмж болно):
- HTTP response header `X-Data-Generated-At: <ISO timestamp>` — client өөрийн
  TTL policy-оор expired эсэхийг шалгана (одоо бид ингэж хийж байна, энэ
  хангалттай).

---

## 3. Priority 2 — Home feed backend response shape confirm

Home дээр 4 card нь одоогоор backend-аас ирсэн shape-ийг `any` хэлбэрээр
defensive тусгаж байна:

| Card | Endpoint | Таамагласан shape | Client файл |
|---|---|---|---|
| livestock_health | `GET /health/stats` | `{ active?, due_vaccinations?, severe? }` эсвэл `{open_cases, upcoming, high_severity}` | `index.tsx:427-444` |
| sum_announcement | `GET /news` | `Array<{title, summary?, description?}>` эсвэл `{items:[], data:[]}` | `index.tsx:463-472` |
| market_prices | `GET /prices/summary` | `Array<{item_type?, price?, avg_price?, animal_type?}>` эсвэл `{items:[]}` | `index.tsx:478-492` |
| nearby_listings | `GET /market?location=X` | `Array<{id, title/name, price?, location?}>` | `index.tsx:497-510` |

**Үйлдэл:** Backend team confirm хийгээд тогтсон shape-т буулгавал client-аас
`any` parsing устана.

---

## 4. Бусад жижиг gap-ууд

- **Phone OTP** — одоогийн `userApi.sendOtp/verifyOtp` ажилладаг ✓
- **Seasonal байршил upload** — `userApi.create({ seasonal })` `any` param-ээр
  хүлээж авдаг ✓. Backend `seasonal_locations` table эсвэл JSONB-д хадгалагдаж
  буй эсэхийг шалгах.
- **Onboarding re-fetch** — backend унасан үед AsyncStorage fallback
  (`services/onboarding-fallback.ts` pure extract, регресс тест-тэй) ✓.
  Backend эрүүл бол pristine flow хэвээр.

---

## 5. Backend-ийг front-тай syncing хийх шаардлагагүй зүйлс

- `daily-tasks.ts` / `migration-advice.ts` — client-side rule engine, locale.
- `advisory-templates.ts` — 15 template локал seed, Phase 2-д content ops
  backend рүү шилжих боломжтой.
- `home-feed-rules.ts` — client-side preferences + role + season-ээр шийдэгдэх
  — backend-д мэдэгдэх шаардлагагүй.

---

## 6. Client-side cache TTL policy (reference)

`services/offline-ttl.ts`-ийн дагуу:

| Category | TTL |
|---|---|
| weather, alerts, market | 15 мин |
| news, ads | 30 мин |
| prices, banks, reminders | 1 цаг |
| insurance | 2 цаг |
| breeding, health, programs | 12 цаг |
| livestock, animals, pastures | 24 цаг |
| knowledge | 7 өдөр |
| diseases | 30 өдөр |

Хэрвээ backend-ийн data шинэчлэлтийн давтамж эдгээрээс илүү хурдан бол TTL-г
client-д бууруулах шаардлагатай.

---

## 7. Owner dashboard (web-only, Sprint 7)

Frontend: `services/owner-dashboard-data.ts` (pure data layer, mobile route
БАЙХГҮЙ — locked web-only). 8 хэсэгт орсон pure aggregator + mock.

**Шаардлагатай:**

```
GET  /owner/snapshot
     → OwnerSnapshot
     { asOf, growth, revenue, productUsage, geography,
       organizations, billing, moderation, contentOps }

// (Нэмэгдэл / веб-ээс хайлттай хэрэгцээ үүсмэгц)
GET  /owner/growth?from=&to=
GET  /owner/revenue?month=
GET  /owner/moderation?status=open
```

Single-glance 6 асуулт (CLAUDE.md §4):
Хэн? (growth.totalUsers) · Хаанаас? (geography.topAimag) ·
Яаж? (productUsage.topFeature) · Хэн төлж? (revenue.activeSubscribers) ·
Аль модуль үнэтэй? (revenue.byPackage top) · Аль сум идэвхтэй? (aimag level).

Endpoint гарсан үед `fetchOwnerSnapshot()` нэг мөр солино — aggregator,
digest helper-уудад өөрчлөлт орохгүй.

---

## 8. Contract freeze (2026-04-24)

Priority 0 + 7 endpoint-уудын typed contract `services/api.ts`-д орлоо.
Backend team эхлэхэд энэ shape-ийг authoritative гэж үзнэ.

Namespace | endpoint | return type
---|---|---
`bagDashboardApi.getHouseholds` | `GET /households/bag/:id` | `Household[]`
`bagDashboardApi.broadcast` | `POST /households/bag/:id/broadcast` | `BroadcastResult`
`sumDashboardApi.getBags` | `GET /sums/:id/bags` | `BagStat[]`
`sumDashboardApi.getEvents` | `GET /sums/:id/events` | `SumEvent[]`
`sumDashboardApi.broadcast` | `POST /sums/:id/broadcast` | `BroadcastResult`
`lostFoundApi.list` | `GET /lost-found?type=&aimag=&sum=` | `Listing[]`
`lostFoundApi.create` | `POST /lost-found` | `Listing`
`lostFoundApi.resolve` | `PUT /lost-found/:id/resolve` | `{ status: 'resolved' }`
`lostFoundApi.report` | `POST /lost-found/:id/report` | `{ reported: true }`
`ownerApi.snapshot` | `GET /owner/snapshot` | `OwnerSnapshot`

Data-layer `fetch*()` функцүүд дээрх api method-ыг эхэнд дуудаж, алдаа
гарвал mock-руу падна. Real endpoint ирэхэд UI-д өөрчлөлт орохгүй —
зөвхөн backend response-ийг типтэй тааруулж гаргана.

---

## 9. Status snapshot (2026-04-24)

- Тест: **379/379**, 28 test suite.
- Backend-тэй 7 card бүгд SWR StaleBadge-тэй (weather, alerts, health,
  sum_announcement, market_prices, nearby_listings, daily_tip). Үлдсэн
  2 home card (daily_tasks, migration_advice) нь pure rule engine —
  backend-аас мэдээлэл татахгүй тул stale концепци хамаарахгүй.
- 4 typed API namespace (bag, sum, lost-found, owner) + data-layer
  real→mock fallback wired.
- Pricing: 5 package registry + `/pricing` screen + `<FeatureGate>` +
  advisory (3/сар) & listings (3 active) cap UI wired.
- Elder capability: profile flag opt-in/disable UX wired.
- Offline sync queue (`services/sync-queue.ts`): queueChange / flushQueue /
  pullChanges / autoSync / **queueOnFailure** + `syncApi` backend contract.
  Wire хийгдсэн callsite:
  - market listings create/update (`app/(tabs)/market.tsx`)
  - livestock нэгдсэн бүртгэл + үйл явдал (`app/(tabs)/livestock.tsx`
    handleAdd + handleEvent)
  - animals бие даасан бүртгэл (animalsApi.create/update — livestock.tsx
    AnimalFormModal)
  - Онбординг мал тоо upload (`app/onboarding/done.tsx`) — сүлжээгүй
    үед мал тоо алдагдахгүй
  `useAutoSync()` hook root layout-д mount-тай, network false→true
  шилжилт дээр автоматаар flush. **Үлдсэн wire:** elder-content submit,
  bag/sum broadcast-ууд — ижил pattern.
