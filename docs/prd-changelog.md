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

### Adjacent: sum-dashboard
- `dff87f3` pure data layer + ranking
- `f6ffe0f` component test (7 case)

**Open question (scope):** sum-dashboard нь MVP §5-д **тусгайлан жагсаагүй**
— bag darga (#12) ба owner dashboard (#13) хоёрын хооронд. Одоогоор
implementation байгаа ч CLAUDE.md §5-т тусгайлан нэмэх эсэх нь шийдэгдээгүй.
Багийн дарга → сумын удирдлага рүү эскалейшн flow тодорхой болох үед
MVP §5-д #12.5 гэж нэмэх эсвэл Phase 2-т гаргах шийдвэр хэрэгтэй.

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
| Sum admin dashboard MVP scope | Implementation бий, §5-д алга | MVP эсвэл Phase 2 болгох |
| Ахмад / Owner role onboarding | CLAUDE.md §3-д 7 role, онбординг picker-т 5 | Ахмад нь profile flag уу, role уу? |
| Pricing flag service | Locked (5 багц) ч код байхгүй | Gating helper interface |
| Owner dashboard scope (Sprint 7) | 8 хэсэг locked ч implementation 0% | Start-д web-only эсвэл mobile-д read-only |
| API endpoint contract | Mock only (backend-gaps.md §1) | Backend team-тэй contract freeze |

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
