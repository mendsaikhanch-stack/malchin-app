// Багийн даргын dashboard-ийн data layer (pure).
//
// Статус (2026-04-24): Backend дээр "багийн бүх өрх" endpoint одоогоор байхгүй
// (householdApi.getMy + getStats зөвхөн бие даасан өрх). Иймд client тал дээр
// mock data-тай ажиллана. Backend team тухайн endpoint-ийг үүсгэсний дараа
// энэ файлын `fetchBagHouseholds()` implementation-ыг л солино — UI
// component-д өөрчлөлт орохгүй.
//
// Backend ойрхон ирэх endpoint (санал):
//   GET /households/bag/:bagId → Household[]
//   GET /households/bag/:bagId/stats → BagStats
//   POST /households/bag/:bagId/broadcast → { recipients: number, sent_at }

export type RiskLevel = 'low' | 'medium' | 'high';

export type Household = {
  id: string;
  head: string;              // Өрхийн тэргүүний нэр
  phone: string;
  members: number;
  animals: number;
  location: string;
  lastActive: string;        // Human-readable (жишээ: "Өнөөдөр", "2 өдрийн өмнө")
  lastActiveDays: number;    // Numeric (risk computation-д ашиглана)
  risk: RiskLevel;
  otor: boolean;
};

export type BagStats = {
  totalHouseholds: number;
  totalAnimals: number;
  riskyCount: number;         // risk !== 'low'
  otorCount: number;
  mediumRisk: number;
  highRisk: number;
  inactive7Days: number;      // 7+ өдөр идэвхгүй өрх
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'Хэвийн',
  medium: 'Анхаарах',
  high: 'Эрсдэлтэй',
};

// Өрхийн risk-ийг метрикээс тооцоолох heuristic
// Оноо:
//   lastActiveDays 0–2 → +0, 3–6 → +1, 7+ → +2
//   otor → +1
//   backendRiskHint: high → +2, medium → +1
// Хязгаар: >=3 high, >=1 medium, else low
export function computeHouseholdRisk(params: {
  lastActiveDays: number;
  otor: boolean;
  backendRiskHint?: RiskLevel;   // Backend-ын өгсөн эрсдэл (хэрвээ бий)
}): RiskLevel {
  let score = 0;
  if (params.lastActiveDays >= 7) score += 2;
  else if (params.lastActiveDays >= 3) score += 1;
  if (params.otor) score += 1;
  if (params.backendRiskHint === 'high') score += 2;
  else if (params.backendRiskHint === 'medium') score += 1;

  if (score >= 3) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

export function computeBagStats(households: Household[]): BagStats {
  const totalAnimals = households.reduce((s, h) => s + h.animals, 0);
  return {
    totalHouseholds: households.length,
    totalAnimals,
    riskyCount: households.filter((h) => h.risk !== 'low').length,
    otorCount: households.filter((h) => h.otor).length,
    mediumRisk: households.filter((h) => h.risk === 'medium').length,
    highRisk: households.filter((h) => h.risk === 'high').length,
    inactive7Days: households.filter((h) => h.lastActiveDays >= 7).length,
  };
}

export function filterRisky(households: Household[]): Household[] {
  return households
    .filter((h) => h.risk !== 'low')
    .sort((a, b) => {
      if (a.risk === 'high' && b.risk !== 'high') return -1;
      if (b.risk === 'high' && a.risk !== 'high') return 1;
      return b.lastActiveDays - a.lastActiveDays;
    });
}

export function filterOtor(households: Household[]): Household[] {
  return households.filter((h) => h.otor);
}

export function sortByLastActive(households: Household[]): Household[] {
  return [...households].sort((a, b) => a.lastActiveDays - b.lastActiveDays);
}

// Human-readable lastActive-аас numeric day-ийг гарган авах parser
// "өдөр" (nominative) ба "өдр..." (genitive: өдрийн, өдрөөс г.м.) хоёуланг танина.
export function parseLastActiveDays(label: string): number {
  const l = label.toLowerCase().trim();
  if (l === 'өнөөдөр' || l === 'today') return 0;
  const m = l.match(/(\d+)\s*(?:өдөр|өдр)/);
  if (m) return parseInt(m[1], 10);
  if (l.includes('долоо хоног')) return 7;
  return 0;
}

// Mock data provider — backend endpoint бэлэн болтол
export function getMockHouseholds(): Household[] {
  const raw: Omit<Household, 'risk' | 'lastActiveDays'>[] = [
    { id: '1', head: 'Батбаяр.Б', phone: '9911****', members: 5, animals: 280, location: '3-р баг, Хүрэн-Овоо', lastActive: 'Өнөөдөр', otor: false },
    { id: '2', head: 'Оюунтуяа.Д', phone: '8822****', members: 4, animals: 180, location: '3-р баг, Цагаан-Овоо', lastActive: '2 өдрийн өмнө', otor: false },
    { id: '3', head: 'Дорж.Т', phone: '9955****', members: 3, animals: 420, location: 'Отор — Баянжаргалан', lastActive: '5 өдрийн өмнө', otor: true },
    { id: '4', head: 'Насанбат.Ц', phone: '9966****', members: 6, animals: 310, location: '3-р баг, Хар-Ус', lastActive: 'Өнөөдөр', otor: false },
    { id: '5', head: 'Сарангэрэл.Э', phone: '9977****', members: 4, animals: 150, location: '3-р баг, Төмөр-Овоо', lastActive: '1 өдрийн өмнө', otor: false },
    { id: '6', head: 'Мөнхбаяр.О', phone: '9988****', members: 2, animals: 90, location: '3-р баг, Улаан-Хад', lastActive: '10 өдрийн өмнө', otor: false },
  ];
  return raw.map((h) => {
    const lastActiveDays = parseLastActiveDays(h.lastActive);
    return {
      ...h,
      lastActiveDays,
      risk: computeHouseholdRisk({
        lastActiveDays,
        otor: h.otor,
      }),
    };
  });
}

import { bagDashboardApi } from './api';

// Backend → cache → mock fallback. Endpoint бэлэн болмогц энэ функц
// өөрчлөгдөхгүй (contract frozen — backend-gaps.md §1.1).
export async function fetchBagHouseholds(bagId?: string): Promise<Household[]> {
  if (!bagId) return getMockHouseholds();
  try {
    return await bagDashboardApi.getHouseholds(bagId);
  } catch {
    return getMockHouseholds();
  }
}
