// Bag ID parser (pure).
//
// Онбординг-д хэрэглэгч баг-аа "1-р баг", "3-р баг" гэх мэтээр бичдэг.
// Dashboard болон backend-д зориулж энэ string-г тогтвортой ID болгоно.
//
// Зорилго: "1-р баг" → "1", "3-р баг" → "3", "гуравдугаар баг" → "3",
// зүгээр "5" → "5", хоосон/таниагүй → null.
//
// Sum slug гарган авах helper мөн энд — "Алтанбулаг" → "altanbulag".

const ORDINAL_MAP: Record<string, string> = {
  нэг: '1', нэгдүгээр: '1', анхны: '1',
  хоёр: '2', хоёрдугаар: '2',
  гурав: '3', гуравдугаар: '3',
  дөрөв: '4', дөрөвдүгээр: '4',
  тав: '5', тавдугаар: '5',
  зургаа: '6', зургаадугаар: '6',
  долоо: '7', долоодугаар: '7',
  найм: '8', наймдугаар: '8',
  ес: '9', есдүгээр: '9',
  арав: '10', аравдугаар: '10',
};

/**
 * Онбординг-ийн bag string-ээс тогтвортой ID гаргаж авна.
 * Таниагүй эсвэл хоосон бол null.
 *
 * Жишээ:
 *   parseBagId('1-р баг') → '1'
 *   parseBagId('3-р Баг') → '3'
 *   parseBagId('гуравдугаар баг') → '3'
 *   parseBagId('4') → '4'
 *   parseBagId('Найрамдал') → 'найрамдал' (label хэвээр)
 *   parseBagId('') → null
 */
export function parseBagId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // Цэвэр тоо — "3", "05"
  const pureNum = s.match(/^0*(\d+)$/);
  if (pureNum) return pureNum[1];

  // "1-р баг", "3-р Баг", "7р баг"
  const dashMatch = s.match(/^0*(\d+)\s*[-–—]?\s*р?\s*[Бб]аг/);
  if (dashMatch) return dashMatch[1];

  // "баг 3", "Баг 7"
  const bagNumMatch = s.match(/^[Бб]аг\s*0*(\d+)/);
  if (bagNumMatch) return bagNumMatch[1];

  // Үгээр тоо — "гуравдугаар баг", "гурав"
  const lower = s.toLowerCase();
  for (const [word, num] of Object.entries(ORDINAL_MAP)) {
    if (lower.startsWith(word)) return num;
  }

  // Нэр — "Найрамдал", "Алтанбулаг" — slugified label
  return lower.replace(/\s+/g, '-');
}

/**
 * Sum нэрийг URL-safe slug болгоно. Backend dashboard endpoint-д зориулж.
 * Монгол үсгийг latin-руу translit хийхгүй (backend JSON-д utf8 хадгалагдана),
 * зөвхөн lowercase + space→dash.
 *
 * Жишээ:
 *   slugifySum('Алтанбулаг') → 'алтанбулаг'
 *   slugifySum('Сайхан овоо') → 'сайхан-овоо'
 *   slugifySum('') → null
 */
export function slugifySum(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  return s.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Багийн дэлгэцийн гарчигт харуулах display label.
 * parseBagId нь "1"/"3" numeric ID буцаадаг бол "1-р баг" гэх UI-friendly
 * текст болгоно. Custom name байвал capitalize хэлбэрээр хэвээр.
 */
export function bagDisplayLabel(raw: string | null | undefined): string {
  if (!raw) return '—';
  const id = parseBagId(raw);
  if (!id) return raw;
  // Numeric ID → "{N}-р баг"
  if (/^\d+$/.test(id)) return `${id}-р баг`;
  // Custom name — raw string-г capitalize
  return raw.trim();
}

/**
 * Онбординг-ийн орчин үеийн баг сонголтод санал болгох дугаар-баг.
 * Бодит байдалд монгол сумд 3-7 баг байдаг, зарим нь 10-ыг давна.
 */
export const DEFAULT_BAG_OPTIONS = [
  '1-р баг',
  '2-р баг',
  '3-р баг',
  '4-р баг',
  '5-р баг',
  '6-р баг',
  '7-р баг',
];
