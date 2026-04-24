# User flows

> **Статус (2026-04-24):** MVP scope-д (CLAUDE.md §5) багтсан flow-уудыг
> бодит route + screen-тэй mapping-лэв. Ирээдүйн (Phase 2/3) flow оруулаагүй.
>
> Flow бүр: entry → алхам → exit + branching.
> Route нь `expo-router` path — `app/` дорх бодит файлтай таарна.

---

## 1. Onboarding (10 алхам)

**Locked decision:** CLAUDE.md §4 "Onboarding".
**Entry:** `app/onboarding/index.tsx` (welcome screen, app-ийг анх нээсэн хүн).

| # | Screen | Route | Үндсэн input | Next |
|---|---|---|---|---|
| 1 | Phone | `/onboarding/phone` | MN утас (+976 …) | OTP илгээгдэнэ |
| 2 | OTP | `/onboarding/otp` | 6 оронт код | name |
| 3 | Name | `/onboarding/name` | овог, нэр | role |
| 4 | Role | `/onboarding/role` | 5 role-оос 1 сонголт | location |
| 5 | Location | `/onboarding/location` | аймаг / сум / баг (picker) | seasonal |
| 6 | Seasonal | `/onboarding/seasonal` | өвөлжөө, хаваржаа, зуслан, намаржаа + одоогийн + оторлох | livestock |
| 7 | Livestock | `/onboarding/livestock` | 5 төрөл: адуу, үхэр, хонь, ямаа, тэмээ | preferences |
| 8 | Preferences | `/onboarding/preferences` | сонирхол tag | review |
| 9 | Review | `/onboarding/review` | бүх data-гийн summary + засах | done |
| 10 | Done | `/onboarding/done` | personalized home ачаалагдана | `/(tabs)/index` |

**Гол дүрэм:**
- Step 6-д "миний байршил" (current location) ба "малын байршил"
  (seasonal) тусдаа ойлголтоор хадгалагдана. CLAUDE.md §4.
- Network алдаа үед fallback: `services/onboarding-fallback.ts` dot-notation
  field-үүдийг дотооддоо хадгалж, sync-reconnect үед backend-руу resume.
- Step бүр дээр phone number өөрчилбөл OTP-оос эхэлнэ (re-verify).

**Role ID mapping:**

| Role (CLAUDE.md) | ID (code) |
|---|---|
| Малчин | `malchin` |
| Багийн дарга | `bag_darga` |
| Сумын ажилтан | `sum_admin` |
| Хоршоо | `khorshoo` |
| Үйлчилгээ үзүүлэгч | `service_provider` |
| Ахмад / контент бүтээгч | (MVP scope-д role сонголт биш — profile flag Phase 2) |
| Owner / Admin | (web-only, mobile-д тавигдаагүй) |

---

## 2. Home feed (role branching)

**Entry:** `app/(tabs)/index.tsx` — бүх role-д нэгэн ижил 9 card
(CLAUDE.md §4 "Home feed").

**Role-тусгай dashboard shortcut** (`(tabs)/index.tsx:289-295`):

| Role | "Миний dashboard" button → |
|---|---|
| `malchin` | (button нуугдана) |
| `bag_darga` | `/bag-dashboard` |
| `sum_admin` | `/sum-dashboard` |
| `khorshoo` | `/coop-dashboard` |
| `service_provider` | `/service-dashboard` |

**9 home card + навигаци:**

1. Өнөөдрийн цаг агаар → weather tab
2. Өнөөдрийн эрсдэл → advisory template "эрсдэл"
3. Өнөөдөр хийх 3 ажил → `daily-tasks.ts` rule-engine
4. Нүүх / оторлох зөвлөгөө → `migration-advice.ts`
5. Малын эрүүл мэндийн дохио → `/(tabs)/health`
6. Сумын шинэ мэдэгдэл → `/inbox`
7. Ахмадын 1 зөвлөгөө → `/wisdom-feed` эсвэл `/elder-content`
8. Зах зээлийн товч үнэ → `/(tabs)/market`
9. Ойролцоох хэрэгтэй зар → `/(tabs)/market` (filter)

Card бүр `<StaleBadge>`-тай — `services/cache-state.ts`-ийн TTL мөхсөн үед
"Хэсэг хугацааны өмнөх" гэж харагдана.

---

## 3. Smart advisory (answer schema)

**Entry:** Home card #2 "Өнөөдрийн эрсдэл" эсвэл tab `/(tabs)/ai-advisor` эсвэл
`/advisory` screen.

**Locked schema (CLAUDE.md §4):**
```
одоо юу хийх → яагаад → 3–7 алхам → анхаарах → эрсдэл → хэнд мэдэгдэх
```

**Flow:**
1. Template сонголт (15 template — `services/advisory-templates.ts`).
2. Context input (малын төрөл, улирал, байршил — onboarding data-аас auto-fill).
3. Answer render — locked 6 хэсгийн layout-аар.
4. История хадгалах (locally + backend queue).
5. "Хэнд мэдэгдэх" bullet → tap хийж `/chat` эсвэл `/inbox`-руу.

**Урт нийтлэл хориотой** — schema-нд таараагүй output render хийхгүй.

---

## 4. Алдсан / Олдсон мал (тусгай UX)

**Entry:** `/lost-found` (home card #9 эсвэл `/(tabs)/market` → filter).

**Flow A — lost (алдсан):**
1. "Мал алдсан" button дарж шинэ зар үүсгэх.
2. Input: малын төрөл, өнгө/тэмдэг, ear tag (сонголттой), сүүлийн үзсэн
   газар (baag-level), огноо, шагнал (сонголттой).
3. `services/lost-found-data.ts` → validation → submit.
4. Баг/сумын chat-д broadcast (auto).
5. Match detection: ижил ear tag эсвэл ойролцоох location-д "found"
   listing байвал notification + suggest.

**Flow B — found (олдсон):**
1. "Мал оллоо" button.
2. Input: зураг, төрөл, өнгө, одоо байгаа газар, ear tag (уншиж чадвал).
3. Submit → багийн chat + PostGIS-аар ойролцоох lost-тэй match.
4. Owner-тэй чатлах → 1:1 chat (`/chat`).

**Privacy:**
- Яг координат public харагдахгүй (CLAUDE.md §4 "Privacy") — баг level.
- Reporter verified user байх шаардлагатай (баталгаажаагүй account нь зөвхөн
  "харах" access).

---

## 5. Bag darga broadcast

**Entry:** `/bag-dashboard` (role `bag_darga` home button).

**Flow:**
1. Dashboard load: `fetchBagHouseholds` → 6 mock өрх (backend unavailable).
2. "Мэдэгдэл илгээх" button → modal.
3. Input: гарчиг + агуулга.
4. Submit → backend queue → бүх household push notification.
5. Дахиад dashboard ranking-т read% шинэчлэгдэнэ.

Offline-first: internet алдагдсан үед `services/sync-queue.ts`-т хадгалж,
reconnect үед автомат илгээгдэнэ.

---

## 6. Sum admin broadcast + event tracking

**Entry:** `/sum-dashboard` (role `sum_admin`).

**Flow:**
1. `fetchSumBags` + `fetchSumEvents` — 5 баг + 3 event mock.
2. Hero: нийт өрх, мал, эрсдэлт, отор.
3. Ranking `readPct`-ээр — хамгийн бага уншилттай багийг хурдан харах.
4. Broadcast modal: scope = `all` эсвэл 1 баг сонголт.
5. Event дээр дарж оролцооны тайлан (Phase 2).

---

## 7. Offline-first sync

**Locked decision:** CLAUDE.md §4 "Offline-first".

**Flow (read):**
1. Component `cachedFetch(key, ttl)` → `services/offline.ts` → cache байвал
   instant return + `<StaleBadge>` нэмэв.
2. Network available үед `services/api.ts` → shadow refresh → cache update
   (stale-while-revalidate).

**Flow (write):**
1. Form submit — network байхгүй үед `sync-queue.ts` дараалалд
   `{ endpoint, method, body, timestamp }`.
2. Reconnect notification → queue drain → retry with exponential backoff.
3. Conflict үед (өөр төхөөрөмжөөс өөрчилсөн) → last-write-wins + audit log.

**Gotcha:**
- Тест үед `AsyncStorage` mock заавал reset хийх (cache leak).
- TTL нь `services/offline-ttl.ts`-д feature-тусгай — market 5м,
  weather 15м, announcement 2цаг.

---

## 8. Profile + privacy

**Entry:** `/(tabs)/profile` → `/privacy-settings`.

**Toggle-ууд:**
- Байршлыг public (баг level)
- Утас public vs зөвхөн verified
- Малын тоо public
- Report + block list

Consent хураангуйгаас хэзээ ч буцаж болно — "Хүсэлт устгах" (GDPR-like).

---

## 9. Phase 2-т нэмэгдэх flow (MVP scope-д ОРОХГҮЙ)

Реферэнс — эдгээрийг сэргээхэд CLAUDE.md §5-ыг update хийх шаардлагатай:

- Verified provider marketplace
- Хоршооны commerce + payout
- Family/education module
- Health insurance (НДШ/ЭМД) deep
- Predictive risk (зуд, өвчин)
- B2G deep integration
- Owner dashboard advanced analytics
