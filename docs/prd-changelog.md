# PRD change log

> **Зорилго:** Locked decision (CLAUDE.md §4) болон MVP scope (CLAUDE.md §5)
> дээр хийгдсэн **зөвхөн үр дагавартай** өөрчлөлтийг түүхчлэн тэмдэглэнэ.
> Тухайн commit-ийн WHAT биш — WHY болон locked decision-д нөлөөлсөн эсэхийг
> хардаг.
>
> Энэ нь commit log-ийн давхардал биш. `git log` бүрэн түүхийг өгнө —
> энд зөвхөн scope/contract өөрчлөлт.
>
> **Convention:**
> - Огноо нь YYYY-MM-DD (UTC+8).
> - Entry тус бүр: ангилал (Locked / MVP / Schema / Tech) → өөрчлөлт → WHY.
> - "No scope change" гэсэн өдөр = decision-д хүрээгүй хэрэгжилт.

---

## 2026-04-24 — Baseline (anchor `134aa22`)

**Locked: PRD.md + CLAUDE.md мастер баримт үүссэн.**

Энэ commit-ийн өмнөх хугацааны шийдвэрүүдийг retroactive-ээр locked гэж
тогтоов. Цаашид өөрчлөхөд заавал CLAUDE.md-д тэмдэглэнэ.

Одоогийн locked status:
- 6 product pillar (CLAUDE.md §2)
- 7 user role (§3)
- 10-алхамт onboarding (§4)
- 9 home card (§4)
- 6-хэсгийн advisory answer schema (§4)
- Marketplace scope — малчны амьдралд холбоотой л (§4)
- 4 privacy дүрэм (§4)
- Offline-first 5 элемент (§4)
- 5 pricing багц + 2 billing урсгал (§4)
- 14 MVP feature (§5)
- 7 sprint implementation order (§6)

---

## 2026-04-24 — Ахмад + Owner role classification locked

**Ангилал:** Locked (CLAUDE.md §3)
**Commit anchor:** (энэ commit)

Өөрчлөлт: CLAUDE.md §3 "User Roles" 7-ийн хавтгай жагсаалт байсныг
3 ангилалд хуваав:
- **Primary (5)** mobile onboarding picker-т: `malchin`, `bag_darga`,
  `sum_admin`, `khorshoo`, `service_provider`.
- **Profile capability (flag)**: `elder_contributor: bool` — role-ээс
  хамааралгүй. 5 role-ийн аль нь ч идэвхжүүлж, `/elder-content` screen-г
  нээдэг. Draft → review → published moderation.
- **Web-only**: Owner/Admin — mobile-д огт харагдахгүй.

WHY: Ахмад болох явц нь primary role (малчин байсан хэвээр) солихгүй —
зэрэг явах capability. Жишээ: 60 настай малчин = `role: malchin,
elder_contributor: true`. Role-ийн exclusive сонголт биш. Одоогийн
`app/elder-content.tsx` аль хэдийн moderation state machine-тэй
(draft/review/published/archived), зөвхөн access gating дутуу.

Нөлөө:
- Onboarding picker (5) шинээр өөрчлөгдөх ёсгүй — status quo.
- `/elder-content` access одоо бүх role-д нээлттэй — флаг guard нэмэх нь
  дараагийн implementation step (changelog-оор зориг биш).
- PRD.md §3 мөн 3 ангилалд хуваасан.
- Owner/Admin нь mobile role picker-т огт байхгүй (confirmed) — web-only
  decision өөрчлөгдөөгүй, зөвхөн тодорхой болсон.

---

## 2026-04-24 — MVP #12 scope өргөжив: sum admin dashboard basic

**Ангилал:** MVP scope
**Commit anchor:** (энэ commit)

Өөрчлөлт: CLAUDE.md §5 #12 + §6 sprint 6, PRD.md ижил — "Bag darga
dashboard basic" → "Bag darga + sum admin dashboard basic". PRD.md §5
Phase 2 дэх "Sum admin dashboard full"-д `(basic нь MVP #12-д)` тэмдэглэл.

WHY: Sum admin dashboard нь аль хэдийн pure data layer (ранкинг, stats,
event sort), UI screen (`app/sum-dashboard.tsx`), 7 component test-тэй
бүрэн implementation-тай байсан. Bag darga + sum admin хоёр нь
архитектурийн хувьд ижил шат (role-based governance dashboard) тул нэг
MVP item-д нэгтгэвэл 14-feature count хадгалагдана.

Нөлөө: Phase 2 "Sum admin dashboard full" хэвээр — advanced
analytics/heatmap/export тэнд байна. Basic scope = өрх тоо, mal тоо,
эрсдэлт, engagement, ranking, event list, broadcast.

---

## 2026-04-24 — Post-baseline execution (anchor → `a060d8b`)

**No scope change.** 26 commit бүгд locked decision-ийг хэрэгжүүлсэн,
шинэ decision нэмээгүй. Group-лэвэл:

### MVP #3 — 4 улирлын байршил + одоогийн байршил
- `747178e` 4-улирлын schema final (өвөлжөө/хаваржаа/зуслан/намаржаа +
  current + оторлох) — CLAUDE.md §4 "миний байршил ≠ малын байршил"
  баталгаажсан.

### MVP #5 — Personalized home
- `fc9cc8c` rule engine skeleton
- `a12688b` → `5ee97a5` 9 card бүрнээр rule engine-д холбогдсон
- `cf55d70` offline TTL feature-тусгай (market 5м, weather 15м, г.м.)

**Өөрчлөлтгүй** — 9 card locked жагсаалт яг хадгалагдсан.

### MVP #6 — Weather + alerts
- `d772a7d` weather provider decision + normalization layer
- `c4bbdcd` OpenWeather direct fetch fallback (3-түвшний: backend → cache
  → OpenWeather)
- `0c28d37` + `40221eb` home card-д `<StaleBadge>` wiring

**Tech decision (non-locked):** OpenWeather нь fallback-д зориулсан —
backend-аас ирэх weather contract primary эх сурвалж хэвээр.

### MVP #8 — Smart advisory basic
- `16c4de3` 15 template seed + PRD schema test
- `a37de83` Advisory screen + home card shortcut
- `2507c44` advisory screen component test (5 case)

**Locked schema хадгалагдсан:** `одоо юу хийх → яагаад → 3–7 алхам →
анхаарах → эрсдэл → хэнд мэдэгдэх`.

### MVP #10 — Lost/found
- `2b4148f` pure data layer + validation + match detection
- `3b808b9` UI-д wire-up
- `c974a91` (hit) lost-found component test

### MVP #12 — Bag darga dashboard basic
- `6358309` pure data layer + risk heuristic
- `c974a91` (hit) component test

### MVP #12 (өргөтгөсөн) — Sum admin dashboard basic
- `dff87f3` pure data layer + ranking
- `f6ffe0f` component test (7 case)

Дээрх 2026-04-24 scope decision-ийн дагуу #12-д багтана.

### Offline-first infrastructure (CLAUDE.md §4)
- `11ca668` stale-while-revalidate pure state + `<StaleBadge>` UI
- `0c28d37` + `40221eb` + `add1108` home card бүрт StaleBadge wire
- `cf55d70` TTL feature-тусгай хуваарилалт

### Testing (infra, non-PRD)
- `27c6267` Jest setup + home feed rule engine test
- `4e21c05` onboarding fallback pure extract + regression
- `b2e4e5e` jest-expo preset + RN component test
- Одоогоор 239/239 passing (`f6ffe0f`).

### Docs (non-PRD)
- `5f1fdea` `docs/backend-gaps.md` — backend endpoint gap summary
- `da8bee4` `.env.example` + `docs/env.md` — env var reference
- `a060d8b` `docs/user-flows.md` — 9 flow route mapping

---

## Pending decisions (хараахан locked биш)

| Сэдэв | Одоогийн төлөв | Шаардагдах шийдвэр |
|---|---|---|
| Pricing flag UI wiring | `services/pricing.ts` pure бэлэн (21 test) | Profile screen pricing CTA + route guard wiring |
| Owner dashboard UI | `services/owner-dashboard-data.ts` pure бэлэн (20 test) | Web front-end (mobile-д нэмэхгүй — web-only locked) |
| API endpoint contract | Mock only (backend-gaps.md §1) | Backend team-тэй contract freeze |
| `elder_contributor` flag gating | Flag decision locked, `/elder-content` access бүх role-д нээлттэй | Profile toggle UI + route guard (implementation step) |

---

## Template — шинэ entry нэмэхдээ

```markdown
## YYYY-MM-DD — <сэдвийн товч>

**Ангилал:** Locked | MVP scope | Schema | Tech
**Commit anchor:** `<short hash>`

Өөрчлөлт: ...

WHY: ... (locked decision-д нөлөөлсөн шалтгаан — дутуу бол retroactive-ээр
зассан шалтгаан)

Бусад locked decision-д нөлөө: ...
```
