# PRD — Malchin Super App (Single Source of Truth)

> Энэ баримт төслийн **мастер баримт** юм. Бүх planning, development, review түүнээс эхэлнэ.
> AI (Claude Code) бичилтийн хураангуй: [`CLAUDE.md`](./CLAUDE.md)

---

## 1. Master Product Brief

### Positioning (1 мөр)
Малчин өглөө бүр орж өдрийн мэдээлэл, зөвлөгөө, сум-багийн мэдэгдэл, зар, орлого, өрхийн хэрэгцээгээ удирддаг **өдөр тутмын супер апп**.

### Executive summary
Монголын малчин өрхийн өдөр тутмын шийдвэрийг нэг дор авчирна. Зөвхөн мал биш — мал + хүн + өрх + засаг захиргаа + зах зээлийг нэгтгэсэн. Ялгарал нь personalized нүүр ба асуултаар хариу өгдөг smart advisory.

### Product pillars (6)
1. DAILY BRIEFING — өглөө нээхэд юу хийхээ мэднэ
2. SMART ADVISORY — асуултаар зөвлөгөө
3. LIVESTOCK & HOUSEHOLD — мал + өрх + ирээдүй
4. COMMUNITY & GOVERNANCE — баг, сум, хоршоо
5. MARKETPLACE & INCOME — зар, солилцоо, нэмэлт орлого
6. KNOWLEDGE & ELDER WISDOM — ахмадын туршлага + албан мэдлэг

### Core user roles
**Primary (5 — mobile onboarding):** Малчин · Багийн дарга · Сумын удирдлага · Хоршоо · Үйлчилгээ үзүүлэгч
**Profile capability:** Ахмад/контент бүтээгч (флэг, role-ээс хамааралгүй)
**Web-only:** Owner/Admin

### Main value proposition
"Өглөө нээхэд өнөөдөр юу хийхээ мэднэ. Асуултаа бичихэд 3–7 алхмаар хариулт авна. Сум, баг, зах зээлтэйгээ нэг аппаас холбогдоно."

---

## 2. Locked Decisions

### 2.1 Onboarding (10 алхам)
Phone → OTP → Нэр/овог → Аймаг/сум/баг → Role → 4 улирлын байршил (өвөлжөө/хаваржаа/зуслан/намаржаа) + одоогийн байршил + оторлох боломжит газар → Малын тоо (адуу/үхэр/хонь/ямаа/тэмээ) → Сонирхол → Personalized home.

**"Миний байршил" ба "малын байршил" тусдаа ойлголт.**

### 2.2 Home feed (9 card)
Өнөөдрийн цаг агаар · Өнөөдрийн эрсдэл · Өнөөдөр хийх 3 ажил · Нүүх/оторлох зөвлөгөө · Малын эрүүл мэндийн дохио · Сумын шинэ мэдэгдэл · Ахмадын 1 зөвлөгөө · Зах зээлийн товч үнэ · Ойролцоох хэрэгтэй зар.

### 2.3 Smart advisory answer schema
`одоо юу хийх` → `яагаад` → `3–7 алхам` → `анхаарах` → `эрсдэл` → `хэнд мэдэгдэх`. Урт нийтлэл биш.

### 2.4 Marketplace scope
Зөвхөн малчны амьдралтай холбоотой: алдсан мал, олдсон мал, өвс тэжээл, тээвэр, унаа, хэрэгцээт бараа, үйлчилгээ, ажиллах хүч, түрээс, хоршооны бараа. Алдсан/олдсон = тусгай UX.

### 2.5 Privacy
- Яг координат public харагдахгүй
- Public = сум/баг түвшин
- Role-based access, consent, moderation, verified user, report

### 2.6 Offline-first
- Сүлжээгүй бүртгэл, локал байршил, ноорог
- Pre-cached content, sync on reconnect

### 2.7 Pricing (5 багц)

| Багц | Зорилтот | Төлбөр |
|---|---|---|
| Free | Малчин бүр | 0 |
| Premium Малчин | Идэвхтэй өрх | Сар/жил in-app |
| Хоршооны багц | Хоршоо | Seat-based |
| Сумын лиценз | ЗДТГ | Жил, B2G invoice |
| Verified провайдер | Үйлчилгээ үзүүлэгч | Сар + commission |

### 2.8 Billing (2 урсгал)
- **A. Digital (in-app):** QPay/card, auto-renewal, dunning — in-app store дүрэм зөвхөн энд
- **B. Org/real-world (web admin):** invoice, external settlement, manual activation

### 2.9 Owner dashboard (8 хэсэг)
Growth · Revenue · Product usage · Geography · Organizations · Payments & billing · Moderation & trust · Content operations.

Single-glance асуулт: Хэн? Хаанаас? Яаж? Хэн төлж байна? Аль модуль үнэ цэнтэй? Аль сум идэвхтэй?

---

## 3. Information Architecture

```
Home (Өнөөдөр)         — briefing, weather, shortcuts
Мал & аж ахуй          — бүртгэл, байршил (4 улирал), отор/нүүдэл
Зөвлөгөө              — smart advisory + малчны ухаан + улирлын карт
Сум & баг             — мэдэгдэл, баг мэдээлэл, баталгаажуулалт
Зах зээл              — зар/солилцоо, алдсан/олдсон, нэмэлт орлого
Малчин хүн            — эрүүл мэнд/ЭМД/НДШ, өрх/хүүхэд, ур чадвар
Профайл               — багц/төлбөр, тохиргоо, privacy
```

**Role-based нэмэлт tab:**
- Багийн дарга: өрх, мал хөдөлгөөн, эрсдэлтэй өрх, мэдэгдэл, баталгаажуулалт, тайлан
- Сумын удирдлага: нийт баг/өрх/мал, эрсдэлтэй бүс, мэдэгдэл хүрэлт, газрын зураг, тайлан/export
- Хоршоо: гишүүн, бараа, захиалга, төлбөр
- Owner (web): 8-section dashboard

---

## 4. MVP Scope (14 feature)

1. Phone + OTP
2. Role + profile (овог/нэр/аймаг/сум/баг)
3. 4 улирлын байршил + одоогийн байршил
4. Малын үндсэн бүртгэл (5 төрөл)
5. Personalized home (сонирхол + role + location)
6. Weather + alerts
7. Сум/багийн мэдэгдэл
8. Smart advisory basic (template асуулт + answer schema)
9. Elder advice basic (аудио/видео/зураг карт)
10. Lost/found animals (тусгай UX)
11. Hay/feed/transport listings
12. Bag darga + sum admin dashboard basic
13. Owner dashboard basic
14. Package/pricing/billing basic + offline sync

---

## 5. Phase 2 / Phase 3

**Phase 2 (MVP + 3–6 сар)**
- Extra income deep flows (гэр буудал, цагаан идээ, морин аялал, гар урлал)
- Health / ЭМД / НДШ / тэтгэвэр module
- Family & education module
- Cooperative commerce
- Verified provider + rating + захиалга
- Sum admin dashboard full (basic нь MVP #12-д)
- Advanced analytics

**Phase 3 (6–12 сар)**
- AI recommendation (personal + geo + season)
- Payout / commission engine
- B2G license (аймаг/яамны интеграц)
- Content monetization (ахмад payout)
- Predictive risk (зуд, өвчин)
- Public API экосистем

---

## 6. Implementation Order (7 sprint)

1. **Foundation** — onboarding stabilization, profile/role, 4-season location schema
2. **Home feed engine** — rule engine, cards, offline cache
3. **Weather + sum announcements** — API, alert types, push
4. **Smart advisory v1** — 15 template + answer renderer + history
5. **Lost/found + listings + chat 1:1**
6. **Bag darga + sum admin dashboard + elder advice cards**
7. **Owner dashboard + pricing flags + billing stub**

---

## 7. Key User Flows (товч)

| # | Flow | Үндсэн алхам |
|---|---|---|
| 1 | Onboarding | Phone → OTP → Нэр → Байршил → Role → 4 улирал → Мал → Сонирхол → Home |
| 2 | Өглөөний нээлт | Open → cached home → weather → 3 ажил → sum alert → quick action |
| 3 | Smart advisory | Асуу → Категори → Template/free → Answer (schema) → Save/share |
| 4 | Алдсан мал | Шторм → Зураг + байршил (тойрог) + шинж → Bag darga мэдэгдэл → Publish → Ойролцоо push |
| 5 | Bag darga өглөө | Login → Dashboard → Эрсдэлтэй өрх → Мэдэгдэл → Баталгаажуулалт → Тайлан |
| 6 | Төлбөр (digital) | Premium → Plan → QPay → Callback → Unlock |
| 7 | Төлбөр (org) | License хүсэлт → Web admin → Invoice → External pay → Admin confirm → Activation |

---

## 8. Risks & Tradeoffs

| Эрсдэл | Бууруулах арга |
|---|---|
| Сүлжээний чанар (хөдөө) | Offline-first, cache, background sync |
| Ахмад настангийн UX | Том фонт, аудио, voice input (Phase 2) |
| Fake/spam зар | Moderation + verified + report |
| Байршлын privacy | Public = сум/баг, exact = зөвшөөрлөөр |
| Sum/Bag adoption | B2G pilot 1–2 аймагт |
| Monetization timing | Эхний 3–6 сар free + usage data |
| Content quality | Editorial pipeline + ахмад шалгалт |
| Зуд үеийн ачаалал | CDN + cached alerts + SMS fallback |

---

## 9. Current Repo State (2026-04-24)

**Хэрэгжсэн:**
- Phone OTP нэвтрэлт
- Онбординг flow (back-end + AsyncStorage fallback)
- Аймаг/сум/баг (Монголын 349 сум бүрэн)
- Малын бүртгэл (5 төрөл + төл)
- Профайл таб focus → онбординг data refresh

**Untracked / WIP:**
- `CLAUDE.md` (шинэ)
- `PRD.md` (шинэ — энэ баримт)

**Stack (таамаг, шалгах):**
- Frontend: React Native / Expo
- Backend: Node/Express эсвэл Supabase
- DB: PostgreSQL + PostGIS
- Storage: S3-compatible

---

## 10. Next 10 Actions

1. `CLAUDE.md` + `PRD.md` commit + push
2. Onboarding regression test (offline fallback + re-login data сэргэх)
3. 4 улирлын байршил schema final + migration
4. Home feed rule engine skeleton (interest + role + location + season)
5. Card component system (weather / alert / advisory / market / listing)
6. Offline cache layer + TTL
7. Weather API сонголт (OpenWeather / Met Mongolia — шалгах)
8. Smart advisory 15 template JSON seed
9. Stack баталгаажуулалт — `CLAUDE.md` §9-д confirm бичих
10. QPay аккаунт status шалгах

---

## 11. Glossary / Naming

- **Миний байршил** — хэрэглэгч өөрийн биеийн байршил
- **Малын байршил** — өрхийн мал байгаа газар
- **4 улирлын байршил** — өвөлжөө / хаваржаа / зуслан / намаржаа
- **Отор** — түр шилжилт
- **Smart advisory** — асуулт-хариу системтэй зөвлөгөө
- **Малчны ухаан** — ахмадын туршлагын контент
- **B2G** — Government-д зориулсан (сум/аймаг)
- **Digital billing (A)** — in-app худалдан авалт
- **Org billing (B)** — байгууллагын invoice төлбөр

---

## 12. Change Log

- **2026-04-24** — Анх үүсгэсэн. Locked decisions, MVP 14, Phase 2/3 split, 7-sprint order, pricing 5-tier, billing A/B, owner dashboard 8-section баталгаажсан.
