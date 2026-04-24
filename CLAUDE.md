# CLAUDE.md — Malchin Super App

Энэ файл нь Claude Code болон бусад AI-д зориулсан **locked project context** юм.
Бүх шийдэл, өөрчлөлтийг энэ баримттай зөрчилдөхгүй хэмжээнд хийнэ.
Дэлгэрэнгүй мастер баримт: [`PRD.md`](./PRD.md)

---

## 1. Positioning

Малчин өглөө бүр орж өдрийн мэдээлэл, зөвлөгөө, сум-багийн мэдэгдэл, зар, орлого, өрхийн хэрэгцээгээ удирддаг **өдөр тутмын супер апп**.

Зөвхөн "малын апп" биш — мал + хүн + өрх + засаг захиргаа + зах зээлийг нэг дор нэгтгэсэн.

---

## 2. Product Pillars (6)

1. DAILY BRIEFING
2. SMART ADVISORY
3. LIVESTOCK & HOUSEHOLD
4. COMMUNITY & GOVERNANCE
5. MARKETPLACE & INCOME
6. KNOWLEDGE & ELDER WISDOM

---

## 3. User Roles

- Малчин
- Багийн дарга
- Сумын удирдлага
- Хоршоо
- Үйлчилгээ үзүүлэгч
- Ахмад / контент бүтээгч
- Owner / Admin (web)

---

## 4. Locked Decisions

### Onboarding (10 алхам)
Phone → OTP → Нэр/овог → Аймаг/сум/баг → Role → 4 улирлын байршил (өвөлжөө/хаваржаа/зуслан/намаржаа) + одоогийн байршил + оторлох боломжит газар → Малын тоо (адуу/үхэр/хонь/ямаа/тэмээ) → Сонирхол → Personalized home.

**"Миний байршил" ба "малын байршил" тусдаа ойлголт.**

### Home feed (9 card)
- Өнөөдрийн цаг агаар
- Өнөөдрийн эрсдэл
- Өнөөдөр хийх 3 ажил
- Нүүх / оторлох зөвлөгөө
- Малын эрүүл мэндийн дохио
- Сумын шинэ мэдэгдэл
- Ахмадын 1 зөвлөгөө
- Зах зээлийн товч үнэ
- Ойролцоох хэрэгтэй зар

### Smart advisory answer schema
`одоо юу хийх` → `яагаад` → `3–7 алхам` → `анхаарах` → `эрсдэл` → `хэнд мэдэгдэх`.
Урт нийтлэл биш.

### Marketplace scope
Зөвхөн малчны амьдралтай холбоотой: алдсан мал, олдсон мал, өвс тэжээл, тээвэр, унаа, хэрэгцээт бараа, үйлчилгээ, ажиллах хүч, түрээс, хоршооны бараа.
Алдсан/олдсон мал = тусгай UX.

### Privacy
- Яг координат public харагдахгүй
- Public = сум / баг түвшин
- Role-based access
- Consent, moderation, verified user, report

### Offline-first
- Сүлжээгүй бүртгэл
- Локал байршил
- Ноорог
- Pre-cached content
- Sync on reconnect

### Pricing (5 багц)
| Багц | Төлбөр |
|---|---|
| Free | 0 |
| Premium Малчин | Сар/жил in-app |
| Хоршооны багц | Seat-based in-app/invoice |
| Сумын лиценз | Жил, B2G invoice |
| Verified провайдер | Сар + commission |

### Billing (2 урсгал)
- **A. Digital (in-app):** QPay/card, auto-renewal, dunning — in-app store дүрэм зөвхөн энд хамаарна
- **B. Org/real-world (web admin):** invoice, external settlement, manual activation

### Owner dashboard (8 хэсэг)
Growth · Revenue · Product usage · Geography · Organizations · Payments & billing · Moderation & trust · Content operations

Single-glance асуулт: Хэн? Хаанаас? Яаж? Хэн төлж? Аль модуль үнэтэй? Аль сум идэвхтэй?

---

## 5. MVP Scope (14 feature)

1. Phone + OTP
2. Role + profile (овог/нэр/аймаг/сум/баг)
3. 4 улирлын байршил + одоогийн байршил
4. Малын үндсэн бүртгэл (5 төрөл)
5. Personalized home
6. Weather + alerts
7. Сум/багийн мэдэгдэл
8. Smart advisory basic (template асуулт + answer schema)
9. Elder advice basic (аудио/видео/зураг карт)
10. Lost/found animals (тусгай UX)
11. Hay/feed/transport listings
12. Bag darga dashboard basic
13. Owner dashboard basic
14. Package/pricing/billing basic + offline sync

**MVP-д орохгүй:** extra income deep, health/insurance module, family/education module, verified provider, cooperative commerce, advanced analytics, AI reco engine, payout/commission engine, B2G deep integration, predictive risk.

---

## 6. Implementation Order (7 sprint)

1. **Foundation** — onboarding stabilization, profile/role, 4-season location schema
2. **Home feed engine** — rule engine, cards, offline cache
3. **Weather + sum announcements** — API, alert types, push
4. **Smart advisory v1** — 15 template + answer renderer + history
5. **Lost/found + listings + chat 1:1**
6. **Bag darga dashboard + elder advice cards**
7. **Owner dashboard + pricing flags + billing stub**

---

## 7. Information Architecture

```
Home (Өнөөдөр)         — briefing, weather, shortcuts
Мал & аж ахуй          — бүртгэл, байршил (4 улирал), отор/нүүдэл
Зөвлөгөө              — smart advisory + малчны ухаан + улирлын карт
Сум & баг             — мэдэгдэл, баг мэдээлэл, баталгаажуулалт
Зах зээл              — зар/солилцоо, алдсан/олдсон, нэмэлт орлого
Малчин хүн            — эрүүл мэнд/ЭМД/НДШ, өрх/хүүхэд, ур чадвар
Профайл               — багц/төлбөр, тохиргоо, privacy
```

Role-based нэмэлт tab: багийн дарга, сумын удирдлага, хоршоо, owner (web).

---

## 8. Working Rules (AI-д зориулсан)

1. Locked decisions-ийг өөрчилж болохгүй. Зөвхөн хэрэгжүүлнэ.
2. Шинэ feature дур мэдэн нэмэхгүй — Phase 2/3-т нэмсэн зүйл MVP-д орохгүй.
3. Давхардсан тайлбар, урт маркетинг текст бүү бич.
4. Хариу бүрт заавал 4 хэсэг: `ТОВЧ ДҮГНЭЛТ` / `БАТАЛСАН ШИЙДВЭР` / `НЭМЭГДСЭН/ӨӨРЧЛӨГДСӨН` / `CONTINUATION NOTE`.
5. Тодорхойгүй зүйл дээр ажил зогсоохгүй — үндэслэлтэй таамаг гаргаж `таамаг` гэж тэмдэглэ.
6. Монгол хэлээр, цэгцтэй, implementation-oriented.

---

## 9. Repo Stack (таамаг — шалгах шаардлагатай)

- Frontend: React Native / Expo
- Backend: Node / Express эсвэл Supabase
- DB: PostgreSQL + PostGIS (байршилд)
- Auth: Phone OTP (хэрэгжсэн)
- Storage: S3-compatible

Commit бүрийн дараа push хийнэ (PC ойр ойрхон унтардаг).

---

## 10. Links

- Дэлгэрэнгүй мастер баримт: [PRD.md](./PRD.md)
- Memory (user preferences): `~/.claude/projects/C--Users-MNG-malchin-app/memory/`
