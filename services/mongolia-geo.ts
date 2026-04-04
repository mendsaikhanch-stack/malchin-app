// =============================================================================
// Mongolia Reverse Geocoding Database
// Maps GPS coordinates to Mongolian administrative divisions (аймаг/сум/баг)
// =============================================================================

export type MongoliaLocation = {
  aimag: string;
  aimag_en: string;
  sum?: string;
  lat: number;
  lng: number;
};

type AimagData = {
  name: string;
  name_en: string;
  center: { lat: number; lng: number };
  sums: Array<{ name: string; lat: number; lng: number }>;
};

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Full aimag + sum database
// ---------------------------------------------------------------------------
const AIMAG_DATABASE: AimagData[] = [
  // 1. Архангай
  {
    name: "Архангай",
    name_en: "Arkhangai",
    center: { lat: 47.8611, lng: 100.7236 },
    sums: [
      { name: "Эрдэнэбулган", lat: 47.86, lng: 100.72 },
      { name: "Цэнхэр", lat: 47.38, lng: 101.72 },
      { name: "Батцэнгэл", lat: 47.65, lng: 100.98 },
      { name: "Өгийнуур", lat: 47.77, lng: 102.76 },
      { name: "Хашаат", lat: 47.62, lng: 100.28 },
      { name: "Их тамир", lat: 47.58, lng: 100.47 },
      { name: "Өндөр-Улаан", lat: 48.07, lng: 100.50 },
      { name: "Хотонт", lat: 47.36, lng: 102.42 },
    ],
  },
  // 2. Баян-Өлгий
  {
    name: "Баян-Өлгий",
    name_en: "Bayan-Ölgii",
    center: { lat: 48.9684, lng: 89.9628 },
    sums: [
      { name: "Өлгий", lat: 48.97, lng: 89.96 },
      { name: "Сагсай", lat: 48.75, lng: 89.67 },
      { name: "Толбо", lat: 48.55, lng: 90.25 },
      { name: "Ногооннуур", lat: 48.97, lng: 89.51 },
      { name: "Алтай", lat: 48.28, lng: 89.52 },
      { name: "Буянт", lat: 49.14, lng: 89.85 },
      { name: "Цэнгэл", lat: 48.95, lng: 89.13 },
      { name: "Дэлүүн", lat: 48.44, lng: 90.60 },
    ],
  },
  // 3. Баянхонгор
  {
    name: "Баянхонгор",
    name_en: "Bayankhongor",
    center: { lat: 46.1947, lng: 100.7181 },
    sums: [
      { name: "Баянхонгор", lat: 46.19, lng: 100.72 },
      { name: "Богд", lat: 45.68, lng: 100.71 },
      { name: "Бөмбөгөр", lat: 46.26, lng: 100.35 },
      { name: "Баянлиг", lat: 45.10, lng: 101.50 },
      { name: "Галуут", lat: 46.72, lng: 100.68 },
      { name: "Жаргалант", lat: 46.42, lng: 101.02 },
      { name: "Эрдэнэцогт", lat: 45.53, lng: 99.56 },
      { name: "Баацагаан", lat: 45.55, lng: 101.87 },
    ],
  },
  // 4. Булган
  {
    name: "Булган",
    name_en: "Bulgan",
    center: { lat: 48.8125, lng: 103.5347 },
    sums: [
      { name: "Булган", lat: 48.81, lng: 103.53 },
      { name: "Дашинчилэн", lat: 48.59, lng: 104.13 },
      { name: "Орхон", lat: 48.58, lng: 103.79 },
      { name: "Сэлэнгэ", lat: 49.22, lng: 103.20 },
      { name: "Хангал", lat: 49.05, lng: 103.85 },
      { name: "Хутаг-Өндөр", lat: 49.38, lng: 102.68 },
      { name: "Баяннуур", lat: 48.63, lng: 103.28 },
      { name: "Бүрэгхангай", lat: 48.31, lng: 103.86 },
    ],
  },
  // 5. Говь-Алтай
  {
    name: "Говь-Алтай",
    name_en: "Govi-Altai",
    center: { lat: 46.3722, lng: 96.2583 },
    sums: [
      { name: "Алтай", lat: 46.37, lng: 96.26 },
      { name: "Есөнбулаг", lat: 46.40, lng: 96.32 },
      { name: "Тонхил", lat: 45.97, lng: 94.70 },
      { name: "Цээл", lat: 45.78, lng: 96.13 },
      { name: "Бигэр", lat: 45.72, lng: 97.18 },
      { name: "Дэлгэр", lat: 45.24, lng: 95.67 },
      { name: "Халиун", lat: 46.21, lng: 97.42 },
      { name: "Тайшир", lat: 46.71, lng: 96.82 },
    ],
  },
  // 6. Говьсүмбэр
  {
    name: "Говьсүмбэр",
    name_en: "Govisümber",
    center: { lat: 46.4756, lng: 108.3572 },
    sums: [
      { name: "Сүмбэр", lat: 46.48, lng: 108.36 },
      { name: "Шивээговь", lat: 46.28, lng: 108.61 },
      { name: "Баянтал", lat: 46.77, lng: 107.96 },
      { name: "Чойр", lat: 46.36, lng: 108.37 },
    ],
  },
  // 7. Дархан-Уул
  {
    name: "Дархан-Уул",
    name_en: "Darkhan-Uul",
    center: { lat: 49.4683, lng: 106.0550 },
    sums: [
      { name: "Дархан", lat: 49.47, lng: 106.06 },
      { name: "Шарын гол", lat: 49.56, lng: 106.36 },
      { name: "Хонгор", lat: 49.27, lng: 105.85 },
      { name: "Орхон", lat: 49.32, lng: 105.68 },
      { name: "Хөтөл", lat: 49.40, lng: 106.30 },
    ],
  },
  // 8. Дорноговь
  {
    name: "Дорноговь",
    name_en: "Dornogovi",
    center: { lat: 44.8928, lng: 110.1164 },
    sums: [
      { name: "Сайншанд", lat: 44.89, lng: 110.12 },
      { name: "Замын-Үүд", lat: 43.72, lng: 111.90 },
      { name: "Айраг", lat: 45.79, lng: 109.15 },
      { name: "Даланжаргалан", lat: 45.34, lng: 109.58 },
      { name: "Мандах", lat: 44.47, lng: 108.29 },
      { name: "Хатанбулаг", lat: 44.65, lng: 109.40 },
      { name: "Эрдэнэ", lat: 44.45, lng: 111.35 },
      { name: "Улаанбадрах", lat: 44.12, lng: 110.72 },
    ],
  },
  // 9. Дорнод
  {
    name: "Дорнод",
    name_en: "Dornod",
    center: { lat: 47.3170, lng: 115.7903 },
    sums: [
      { name: "Чойбалсан", lat: 48.07, lng: 114.53 },
      { name: "Халхгол", lat: 47.62, lng: 118.62 },
      { name: "Баян-Уул", lat: 47.80, lng: 113.12 },
      { name: "Дашбалбар", lat: 49.55, lng: 114.40 },
      { name: "Цагаан-Овоо", lat: 47.90, lng: 115.18 },
      { name: "Матад", lat: 47.15, lng: 115.63 },
      { name: "Гурванзагал", lat: 48.68, lng: 114.90 },
      { name: "Хөлөнбуйр", lat: 47.33, lng: 116.88 },
    ],
  },
  // 10. Дундговь
  {
    name: "Дундговь",
    name_en: "Dundgovi",
    center: { lat: 45.7633, lng: 106.2647 },
    sums: [
      { name: "Мандалговь", lat: 45.76, lng: 106.27 },
      { name: "Сайнцагаан", lat: 45.79, lng: 106.28 },
      { name: "Өндөршил", lat: 46.33, lng: 106.52 },
      { name: "Адаацаг", lat: 45.91, lng: 107.47 },
      { name: "Дэлгэрцогт", lat: 45.28, lng: 106.78 },
      { name: "Дэрэн", lat: 46.29, lng: 105.12 },
      { name: "Говь-Угтаал", lat: 46.19, lng: 106.55 },
      { name: "Луус", lat: 46.67, lng: 106.52 },
    ],
  },
  // 11. Завхан
  {
    name: "Завхан",
    name_en: "Zavkhan",
    center: { lat: 48.2608, lng: 96.0703 },
    sums: [
      { name: "Улиастай", lat: 47.74, lng: 96.85 },
      { name: "Тосонцэнгэл", lat: 48.74, lng: 98.28 },
      { name: "Цагаанхайрхан", lat: 48.15, lng: 97.72 },
      { name: "Алдархаан", lat: 48.49, lng: 96.63 },
      { name: "Доронговь", lat: 47.38, lng: 97.03 },
      { name: "Их-Уул", lat: 48.78, lng: 97.62 },
      { name: "Тэлмэн", lat: 48.58, lng: 97.40 },
      { name: "Яруу", lat: 48.28, lng: 96.38 },
    ],
  },
  // 12. Орхон
  {
    name: "Орхон",
    name_en: "Orkhon",
    center: { lat: 49.0278, lng: 104.0869 },
    sums: [
      { name: "Эрдэнэт", lat: 49.03, lng: 104.09 },
      { name: "Жаргалант", lat: 49.05, lng: 104.15 },
      { name: "Баян-Өндөр", lat: 49.07, lng: 104.17 },
      { name: "Цагаанчулуут", lat: 49.10, lng: 103.90 },
      { name: "Хялганат", lat: 49.02, lng: 103.80 },
    ],
  },
  // 13. Өвөрхангай
  {
    name: "Өвөрхангай",
    name_en: "Övörkhangai",
    center: { lat: 46.7958, lng: 102.7733 },
    sums: [
      { name: "Арвайхээр", lat: 46.26, lng: 102.78 },
      { name: "Хархорин", lat: 47.20, lng: 102.82 },
      { name: "Хужирт", lat: 46.90, lng: 102.77 },
      { name: "Баянгол", lat: 46.56, lng: 101.47 },
      { name: "Нарийнтээл", lat: 46.04, lng: 101.52 },
      { name: "Бат-Өлзий", lat: 46.79, lng: 102.10 },
      { name: "Төгрөг", lat: 46.33, lng: 101.60 },
      { name: "Уянга", lat: 46.58, lng: 102.11 },
    ],
  },
  // 14. Өмнөговь
  {
    name: "Өмнөговь",
    name_en: "Ömnögovi",
    center: { lat: 43.5711, lng: 104.4250 },
    sums: [
      { name: "Даланзадгад", lat: 43.57, lng: 104.43 },
      { name: "Ханбогд", lat: 43.19, lng: 107.17 },
      { name: "Цогтцэций", lat: 43.32, lng: 105.89 },
      { name: "Гурвантэс", lat: 43.18, lng: 101.08 },
      { name: "Номгон", lat: 42.38, lng: 104.60 },
      { name: "Булган", lat: 44.09, lng: 103.54 },
      { name: "Сэврэй", lat: 43.03, lng: 104.68 },
      { name: "Баяндалай", lat: 43.51, lng: 103.51 },
    ],
  },
  // 15. Сүхбаатар
  {
    name: "Сүхбаатар",
    name_en: "Sükhbaatar",
    center: { lat: 46.6833, lng: 113.2833 },
    sums: [
      { name: "Баруун-Урт", lat: 46.68, lng: 113.28 },
      { name: "Эрдэнэцагаан", lat: 46.50, lng: 112.42 },
      { name: "Сүхбаатар", lat: 46.20, lng: 113.75 },
      { name: "Дарьганга", lat: 45.38, lng: 113.87 },
      { name: "Асгат", lat: 46.67, lng: 112.07 },
      { name: "Мөнххаан", lat: 46.80, lng: 112.82 },
      { name: "Наран", lat: 46.75, lng: 113.60 },
      { name: "Халзан", lat: 47.05, lng: 114.10 },
    ],
  },
  // 16. Сэлэнгэ
  {
    name: "Сэлэнгэ",
    name_en: "Selenge",
    center: { lat: 49.8900, lng: 106.1847 },
    sums: [
      { name: "Сүхбаатар", lat: 50.24, lng: 106.21 },
      { name: "Мандал", lat: 49.46, lng: 107.00 },
      { name: "Зүүнбүрэн", lat: 50.18, lng: 106.30 },
      { name: "Алтанбулаг", lat: 50.33, lng: 106.50 },
      { name: "Шаамар", lat: 49.67, lng: 106.10 },
      { name: "Ерөө", lat: 49.83, lng: 106.85 },
      { name: "Цагааннуур", lat: 49.62, lng: 105.49 },
      { name: "Баянгол", lat: 49.83, lng: 106.40 },
    ],
  },
  // 17. Төв
  {
    name: "Төв",
    name_en: "Töv",
    center: { lat: 47.7131, lng: 106.9528 },
    sums: [
      { name: "Зуунмод", lat: 47.71, lng: 107.00 },
      { name: "Налайх", lat: 47.75, lng: 107.35 },
      { name: "Борнуур", lat: 48.42, lng: 106.12 },
      { name: "Жаргалант", lat: 48.04, lng: 106.68 },
      { name: "Баянцагаан", lat: 47.16, lng: 107.00 },
      { name: "Эрдэнэсант", lat: 47.26, lng: 105.15 },
      { name: "Лүн", lat: 47.95, lng: 105.62 },
      { name: "Баянцогт", lat: 48.19, lng: 106.00 },
    ],
  },
  // 18. Увс
  {
    name: "Увс",
    name_en: "Uvs",
    center: { lat: 49.9847, lng: 92.0669 },
    sums: [
      { name: "Улаангом", lat: 49.98, lng: 92.07 },
      { name: "Өмнөговь", lat: 49.22, lng: 91.73 },
      { name: "Баруунтуруун", lat: 49.65, lng: 94.30 },
      { name: "Зүүнговь", lat: 49.42, lng: 92.15 },
      { name: "Бөхмөрөн", lat: 50.18, lng: 91.50 },
      { name: "Наранбулаг", lat: 49.38, lng: 92.83 },
      { name: "Тариалан", lat: 49.60, lng: 92.50 },
      { name: "Түргэн", lat: 49.85, lng: 92.83 },
    ],
  },
  // 19. Ховд
  {
    name: "Ховд",
    name_en: "Khovd",
    center: { lat: 48.0056, lng: 91.6428 },
    sums: [
      { name: "Ховд", lat: 48.01, lng: 91.64 },
      { name: "Жаргалант", lat: 47.97, lng: 91.59 },
      { name: "Булган", lat: 46.10, lng: 91.55 },
      { name: "Мянгад", lat: 47.78, lng: 92.15 },
      { name: "Эрдэнэбүрэн", lat: 48.60, lng: 91.55 },
      { name: "Мөст", lat: 47.60, lng: 91.92 },
      { name: "Манхан", lat: 47.40, lng: 92.23 },
      { name: "Чандмань", lat: 47.10, lng: 92.55 },
    ],
  },
  // 20. Хөвсгөл
  {
    name: "Хөвсгөл",
    name_en: "Khövsgöl",
    center: { lat: 49.3892, lng: 99.7250 },
    sums: [
      { name: "Мөрөн", lat: 49.64, lng: 100.16 },
      { name: "Хатгал", lat: 50.27, lng: 100.17 },
      { name: "Цагааннуур", lat: 51.28, lng: 100.52 },
      { name: "Ринчинлхүмбэ", lat: 51.12, lng: 99.67 },
      { name: "Төмөрбулаг", lat: 49.25, lng: 99.85 },
      { name: "Цэцэрлэг", lat: 49.46, lng: 100.63 },
      { name: "Чандмань-Өндөр", lat: 49.88, lng: 100.85 },
      { name: "Шинэ-Идэр", lat: 49.55, lng: 99.28 },
    ],
  },
  // 21. Хэнтий
  {
    name: "Хэнтий",
    name_en: "Khentii",
    center: { lat: 47.3178, lng: 109.6513 },
    sums: [
      { name: "Өндөрхаан", lat: 47.32, lng: 110.66 },
      { name: "Батноров", lat: 48.18, lng: 111.52 },
      { name: "Биндэр", lat: 48.63, lng: 110.42 },
      { name: "Дадал", lat: 49.02, lng: 111.62 },
      { name: "Дэлгэрхаан", lat: 47.03, lng: 109.42 },
      { name: "Жаргалтхаан", lat: 47.50, lng: 109.48 },
      { name: "Хэрлэн", lat: 47.33, lng: 110.00 },
      { name: "Мөрөн", lat: 47.55, lng: 111.22 },
    ],
  },
  // 22. Улаанбаатар
  {
    name: "Улаанбаатар",
    name_en: "Ulaanbaatar",
    center: { lat: 47.9214, lng: 106.9055 },
    sums: [
      { name: "Баянгол", lat: 47.91, lng: 106.87 },
      { name: "Баянзүрх", lat: 47.93, lng: 107.01 },
      { name: "Сүхбаатар", lat: 47.92, lng: 106.92 },
      { name: "Чингэлтэй", lat: 47.93, lng: 106.89 },
      { name: "Хан-Уул", lat: 47.88, lng: 106.91 },
      { name: "Сонгинохайрхан", lat: 47.91, lng: 106.78 },
      { name: "Налайх", lat: 47.75, lng: 107.35 },
      { name: "Багануур", lat: 47.74, lng: 108.36 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Find the nearest aimag center to the given GPS coordinates.
 */
export function findNearestAimag(lat: number, lng: number): MongoliaLocation {
  let nearest: AimagData = AIMAG_DATABASE[0];
  let minDist = Infinity;

  for (const aimag of AIMAG_DATABASE) {
    const dist = haversineDistance(lat, lng, aimag.center.lat, aimag.center.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = aimag;
    }
  }

  return {
    aimag: nearest.name,
    aimag_en: nearest.name_en,
    lat: nearest.center.lat,
    lng: nearest.center.lng,
  };
}

/**
 * Find the nearest aimag + sum to the given GPS coordinates.
 * First finds the nearest aimag, then the nearest sum within that aimag.
 * Also checks neighboring aimags in case the point is near a border.
 */
export function findNearestSum(lat: number, lng: number): MongoliaLocation {
  // Gather the 3 closest aimags to handle border areas
  const aimagDistances = AIMAG_DATABASE.map((a) => ({
    aimag: a,
    dist: haversineDistance(lat, lng, a.center.lat, a.center.lng),
  })).sort((a, b) => a.dist - b.dist);

  const candidateAimags = aimagDistances.slice(0, 3);

  let bestAimag: AimagData = candidateAimags[0].aimag;
  let bestSum: { name: string; lat: number; lng: number } | null = null;
  let minSumDist = Infinity;

  for (const { aimag } of candidateAimags) {
    for (const sum of aimag.sums) {
      const dist = haversineDistance(lat, lng, sum.lat, sum.lng);
      if (dist < minSumDist) {
        minSumDist = dist;
        bestSum = sum;
        bestAimag = aimag;
      }
    }
  }

  return {
    aimag: bestAimag.name,
    aimag_en: bestAimag.name_en,
    sum: bestSum?.name,
    lat: bestSum?.lat ?? bestAimag.center.lat,
    lng: bestSum?.lng ?? bestAimag.center.lng,
  };
}

/**
 * Returns a list of all aimag names (Mongolian).
 */
export function getAimagList(): string[] {
  return AIMAG_DATABASE.map((a) => a.name);
}

/**
 * Returns the sum names belonging to the given aimag.
 */
export function getSumsByAimag(aimag: string): string[] {
  const found = AIMAG_DATABASE.find(
    (a) => a.name === aimag || a.name_en === aimag
  );
  return found ? found.sums.map((s) => s.name) : [];
}

/**
 * Returns the center coordinates for an aimag, or null if not found.
 */
export function getAimagCenter(
  aimag: string
): { lat: number; lng: number } | null {
  const found = AIMAG_DATABASE.find(
    (a) => a.name === aimag || a.name_en === aimag
  );
  return found ? { ...found.center } : null;
}
