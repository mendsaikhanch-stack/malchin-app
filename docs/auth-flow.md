# Authentication + Token Refresh Flow

MVP-д client-side **бүрэн бэлтгэгдсэн**. Backend `/auth/refresh` endpoint
холбогдсон өдрөөс эхлэн session нь автомат сунгагдах болно.

---

## Token төрөл

| Төрөл | Нас | Хэрэглээ | Storage key |
|---|---|---|---|
| Access token | ~1 цаг | API request бүрд `Authorization: Bearer <token>` | `@malchin_token` |
| Refresh token | ~30 хоног | Зөвхөн `/auth/refresh` дуудахад | `@malchin_refresh_token` |

Хоёуланг `AsyncStorage` + in-memory cache-д хадгална.

---

## Backend contract (expected)

### Нэвтрэлт / бүртгэл — токэн хоёуланг буцаана

```
POST /users/login         → { token, refreshToken, user }
POST /users/create        → { token, refreshToken, user }
POST /auth/verify-otp     → { verified: true }
```

### Refresh endpoint

```
POST /auth/refresh
Body: { refreshToken: "R..." }
Response (200): { token: "A...", refreshToken: "R..." (optional rotation) }
Response (401): refresh token хүчингүй — client logout
```

---

## Client-д хэрхэн ажилладаг

### 1. Login/Create response
`otp.tsx` / `done.tsx` `userApi.login()` эсвэл `userApi.create()`
дуудаад response-ийг `setAuthTokens(res)`-д дамжуулна. Энэ функц нь
`token` болон `refreshToken` хоёуланг storage + cache-д хадгална.

### 2. Request бүрд
`services/api.ts`-ийн `request()`:
- `getAccessToken()` — cache-ээс эсвэл storage-аас авна
- `Authorization: Bearer <access>` header-тэй илгээнэ

### 3. 401 response гарвал
`request()` нь automatic retry логиктой:
1. Backend 401 status буцаана → `refreshAccessToken()` дуудна
2. `refreshAccessToken()` нь `/auth/refresh` дуудаж шинэ access token авна
3. Шинэ токэнээр анхны запросыг **дахин** (retry)
4. Retry амжилттай бол data буцана

Concurrent-safe: олон API call ижил зуурт 401 болсон ч `inflightRefresh`
guard-ээр **нэг л refresh** хийгдэнэ. Бусад нь ижил promise-ийг хүлээнэ.

### 4. Refresh амжилтгүй үед
- Backend 401 /auth/refresh: refresh token хүчингүй
- `refreshAccessToken()` null буцаана
- `request()` recursion хийхгүй — `/auth/refresh`-ийн 401 нь шууд throw
- UI дарааллаар `clearAuthTokens()` + onboarding-руу буцаана (logout)

### 5. Logout
`profile.tsx`-ийн `performLogout()`:
```ts
await Promise.all([
  AsyncStorage.multiRemove([ONBOARDING_DATA_KEY, ONBOARDING_DONE_KEY]),
  clearAuthTokens(),  // хоёр token устгана + in-memory cache reset
]);
```

---

## Хэзээ бэлэн боллоо

Client код 100% бэлэн:
- ✅ `services/auth-token.ts` — pure token manager (13 unit test)
- ✅ `services/api.ts` — 401 retry логик
- ✅ `app/onboarding/done.tsx` — `setAuthTokens(res)` call
- ✅ `app/onboarding/otp.tsx` — login flow-д `setAuthTokens(loginRes)` call
- ✅ `app/(tabs)/profile.tsx` — logout дээр `clearAuthTokens()` call

**Backend хэрэв:**
- `POST /auth/refresh` endpoint хэрэгжүүлнэ
- Login/create response-д `refreshToken` нэмнэ
- Access token-д expiry нэмнэ (JWT exp 1 цаг гэх мэт)

...хийсний дараа client код нэмэлт өөрчлөлтгүйгээр ажиллана.

---

## Туршилт бэлэн

```bash
npm test -- --testPathPattern auth-token
```

13 тест:
- `setTokens` access-only, both, null тохиолдол бүрд
- `getAccessToken` / `getRefreshToken` буцаах утга
- `clearTokens` бүгдийг цэвэрлэх
- `refreshAccessToken` — байхгүй, амжилттай, 401, throw, rotation, concurrent
