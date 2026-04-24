// Алдсан / Олдсон малын data layer (pure).
//
// PRD: Lost/found нь marketplace-ийн тусгай UX-тэй хэсэг.
// Contract freeze: `lostFoundApi` (services/api.ts), endpoint shape
// docs/backend-gaps.md §1.3-д (dedicated /lost-found/* path, marketApi биш).
//
// Энэ файлын үүрэг:
// 1. Типийг тодорхойлох (Listing, ListingType)
// 2. Form validation — pure, UI-гүйгээр тестлэгдэнэ
// 3. Lost vs Found хоорондын боломжит match detection (жишээ: "2 хээр адуу алдсан"
//    + "1 хээр адуу олдсон" → 70% магадлал)
// 4. Filter / sort helpers
// 5. fetchLostFoundListings real→mock fallback

export type ListingType = 'lost' | 'found';
export type ListingStatus = 'active' | 'resolved' | 'pending';

export type Listing = {
  id: string;
  type: ListingType;
  species: string;           // 'horse'|'cow'|'sheep'|'goat'|'camel'
  count: number;
  color: string;
  age: string;
  brand: string;             // тамга (ж: "Зүүн гуянд 'Х'")
  earTag: string;            // MN-12345
  lastSeen: string;          // Free-form location text
  phone: string;
  reward?: string;
  date: string;              // YYYY-MM-DD
  status: ListingStatus;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationError = {
  field: keyof Listing;
  message: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

// Монгол утасны дугаар: 8 оронтой тоо (8XXXXXXX, 9XXXXXXX)
const MN_PHONE_RE = /^[0-9]{8}$/;

export function validateListing(input: Partial<Listing>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.species || !input.species.trim()) {
    errors.push({ field: 'species', message: 'Төрөл сонгоно уу' });
  }
  if (!input.count || input.count <= 0) {
    errors.push({ field: 'count', message: 'Тоо 1-ээс их байх ёстой' });
  }
  if (!input.lastSeen || !input.lastSeen.trim()) {
    errors.push({ field: 'lastSeen', message: 'Сүүлд үзсэн газар заавал' });
  }
  if (!input.phone || !input.phone.trim()) {
    errors.push({ field: 'phone', message: 'Холбогдох утас заавал' });
  } else if (!MN_PHONE_RE.test(input.phone.replace(/\s|-/g, ''))) {
    errors.push({ field: 'phone', message: '8 оронтой утас бичнэ үү' });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ---------------------------------------------------------------------------
// Filters & sort
// ---------------------------------------------------------------------------

export function filterByType(list: Listing[], type: ListingType): Listing[] {
  return list.filter((l) => l.type === type);
}

export function filterByStatus(list: Listing[], status: ListingStatus): Listing[] {
  return list.filter((l) => l.status === status);
}

export function countActive(list: Listing[], type: ListingType): number {
  return list.filter((l) => l.type === type && l.status === 'active').length;
}

export function sortByDateDesc(list: Listing[]): Listing[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Match detection: lost ↔ found
// ---------------------------------------------------------------------------

// Score 0.0–1.0 — хоёр listing хоорондын боломжит тохироо
// Зарчим: species (хатуу match), зүс, нас, earTag хүчтэй, brand дунд, location light
export function matchScore(lost: Listing, found: Listing): number {
  if (lost.type === found.type) return 0;
  if (lost.species !== found.species) return 0;

  // earTag бол хамгийн хүчтэй match (шууд baterlagdsan)
  if (
    lost.earTag &&
    found.earTag &&
    normalize(lost.earTag) === normalize(found.earTag)
  ) {
    return 1.0;
  }

  let score = 0.3; // species match base

  if (lost.color && found.color && normalize(lost.color) === normalize(found.color)) {
    score += 0.25;
  }

  if (
    lost.brand &&
    found.brand &&
    brandsSimilar(lost.brand, found.brand)
  ) {
    score += 0.2;
  }

  if (lost.age && found.age && agesSimilar(lost.age, found.age)) {
    score += 0.1;
  }

  // Ойролцоо хугацаанд (7 хоногийн дотор) — магадлал нэмэгдэнэ
  if (datesWithinDays(lost.date, found.date, 7)) {
    score += 0.15;
  }

  return Math.min(score, 0.95);
}

export function findPotentialMatches(
  target: Listing,
  others: Listing[],
  threshold = 0.5
): Array<{ listing: Listing; score: number }> {
  return others
    .filter((o) => o.id !== target.id)
    .map((o) => ({
      listing: o,
      score: matchScore(
        target.type === 'lost' ? target : o,
        target.type === 'lost' ? o : target
      ),
    }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function brandsSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // Тамга ихэвчлэн "зүүн/баруун гуянд 'X'" форматтай. Нэгэн үсэг болох эсэхийг шалгана.
  const letterA = na.match(/['"]([^'"]+)['"]/)?.[1];
  const letterB = nb.match(/['"]([^'"]+)['"]/)?.[1];
  if (letterA && letterB && letterA === letterB) return true;
  return false;
}

function agesSimilar(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na === nb) return true;
  const numA = na.match(/(\d+)/g)?.map(Number) || [];
  const numB = nb.match(/(\d+)/g)?.map(Number) || [];
  if (numA.length === 0 || numB.length === 0) return false;
  // Ranges overlap 2 жилийн дотор
  const minA = Math.min(...numA);
  const maxA = Math.max(...numA);
  const minB = Math.min(...numB);
  const maxB = Math.max(...numB);
  return Math.abs(minA - minB) <= 2 || Math.abs(maxA - maxB) <= 2;
}

function datesWithinDays(a: string, b: string, days: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  const diff = Math.abs(da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

// ---------------------------------------------------------------------------
// Mock provider + backend swap point
// ---------------------------------------------------------------------------

export function getMockListings(): Listing[] {
  return [
    {
      id: '1', type: 'lost', species: 'horse', count: 2, color: 'Хээр',
      age: '5-7 настай', brand: "Зүүн гуянд 'Х'", earTag: '',
      lastSeen: 'Алтанбулаг сумын 3-р баг, Хүрэн-Овоо',
      phone: '99112233', reward: '200,000₮',
      date: '2026-04-22', status: 'active',
    },
    {
      id: '2', type: 'found', species: 'cow', count: 1, color: 'Алаг',
      age: '3 настай', brand: "Баруун гуянд 'Б'", earTag: 'MN-12345',
      lastSeen: 'Заамар сумын төвд', phone: '88224455',
      date: '2026-04-21', status: 'active',
    },
    {
      id: '3', type: 'lost', species: 'sheep', count: 15, color: 'Цагаан',
      age: 'Хуц бухтай', brand: 'Тэмдэггүй', earTag: '',
      lastSeen: 'Баянчандмань сумын 2-р баг', phone: '99556677', reward: 'Хэлэлцье',
      date: '2026-04-20', status: 'active',
    },
  ];
}

import { lostFoundApi } from './api';

// Backend → cache → mock fallback (contract frozen — backend-gaps.md §1.3).
// Params хамгаалагдсан — UI-аас filter (type/aimag/sum) дамжуулахад тохирно.
export async function fetchLostFoundListings(params?: {
  type?: 'lost' | 'found';
  aimag?: string;
  sum?: string;
}): Promise<Listing[]> {
  try {
    return await lostFoundApi.list(params);
  } catch {
    return getMockListings();
  }
}

// Шинэ listing нэмэх (client-side id generate; backend орлуулна)
export function buildListing(
  input: Omit<Listing, 'id' | 'date' | 'status'> & Partial<Pick<Listing, 'status'>>
): Listing {
  return {
    ...input,
    id: Date.now().toString(),
    date: new Date().toISOString().slice(0, 10),
    status: input.status ?? 'active',
  };
}
