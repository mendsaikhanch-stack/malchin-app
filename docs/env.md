# Environment variables

> **Статус (2026-04-24):** MVP app 2 public env var ашиглаж байна.
> `.env.example`-ийг `.env` болгон хуулсны дараа Expo-г бүрэн restart
> хийх шаардлагатай (`expo start -c` — cache clear).

Энэ файл нь бүх `EXPO_PUBLIC_*` var-уудын жагсаалт, гарц, test-д яаж
override хийх заавар.

---

## 1. Setup

```bash
cp .env.example .env
# утга оруулж засна
npx expo start -c   # cache clear шаардлагатай — RN bundler-т env заавал restart
```

`.env` нь `.gitignore`-д (`.env`, `.env.*`, `!.env.example`) — commit
хийгдэхгүй. Key-г зөвхөн локал + CI secret-д байлга.

---

## 2. Var reference

### `EXPO_PUBLIC_API_URL`

- **Хаана ашиглагдах:** `services/api.ts:9` — backend REST хаягийн base.
- **Default:** тавиагүй үед `__DEV__` горимд `http://192.168.0.100:5000`
  руу fallback, production bundle-д `https://api.malchin.mn`.
- **Dev зөвлөгөө:** утас + компьютер нэг Wi-Fi дээр байх ёстой. Компьютер IP
  өөрчлөгдвөл энэ value-г шинэчилнэ.

### `EXPO_PUBLIC_OPENWEATHER_API_KEY`

- **Хаана ашиглагдах:** `services/openweather-client.ts:13` — 3-түвшний
  weather fallback (backend → cache → OpenWeather direct).
- **Default:** тавиагүй үед `isOpenWeatherAvailable()` `false` буцаана,
  fallback idle → weather card `StaleBadge` + backend/cache-ийн дараах
  утгыг харуулна.
- **Key авах:** https://openweathermap.org/api — free tier 60 call/min +
  1000/day MVP-д хангалттай.
- **Хамгаалалт:** public bundle-д орно — abuse хязгаарлахын тулд
  OpenWeather dashboard дээр request per day limit + domain restriction
  тохируулахыг зөвлөнө (production).

---

## 3. Test-д override хийх

Jest тест дундуур env-г mutate хийх үед beforeEach/afterEach-д зөвхөн
тухайн test-ийнхээ scope-д set, устга:

```ts
beforeEach(() => {
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'test-key-123';
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
});
```

Жишээ: `services/__tests__/openweather-client.test.ts:15–41`.

---

## 4. Нэмэх шинэ env var

1. `.env.example`-д var + тайлбар comment + default/empty value бичнэ.
2. Энэ docs файл дээр section нэмнэ (хаана ашиглагдах + default behaviour
   + авах гарц).
3. Код дотор `process.env.FOO`-г зөвхөн нэг газраас (service layer)
   уншина — UI-с шууд бүү уншина (тест хялбар болно).
4. Var байхгүй үеийн fallback заавал тод бичигдсэн байх.
5. `EXPO_PUBLIC_*` **биш** secret нэмэх шаардлагатай бол server-side
   хадгална (backend `.env`) — клиент bundle-д орох ёсгүй.
