// Сумын удирдлагын dashboard-ийн data layer (pure).
//
// Статус (2026-04-24): Backend дээр "нийт сумын баг + статистик" aggregated
// endpoint байхгүй. Client тал mock-тай ажиллана. Backend team-д санал:
//   GET /sums/:sumId/bags → BagStat[]
//   GET /sums/:sumId/stats → SumStats
//   GET /sums/:sumId/events → SumEvent[]
//   POST /sums/:sumId/broadcast → { recipients, sent_at }

export type BagStat = {
  id: string;
  name: string;
  households: number;
  animals: number;
  active: number;       // 7 хоногт идэвхтэй өрхийн тоо
  risky: number;        // эрсдэлтэй өрх
  otor: number;         // оторт гарсан өрх
  readPct: number;      // 0..100 (мэдэгдэл уншилт)
};

export type SumEvent = {
  id: string;
  title: string;
  date: string;         // YYYY-MM-DD
  participation: number; // 0..100 (%)
};

export type SumStats = {
  bagCount: number;
  totalHouseholds: number;
  totalAnimals: number;
  totalRisky: number;
  totalOtor: number;
  totalActive: number;
  engagementPct: number;      // totalActive / totalHouseholds
  avgReadPct: number;
  lowReadBags: number;        // readPct < 60
};

// -----------------------------------------------------------------------
// Aggregators
// -----------------------------------------------------------------------

export function computeSumStats(bags: BagStat[]): SumStats {
  if (bags.length === 0) {
    return {
      bagCount: 0,
      totalHouseholds: 0,
      totalAnimals: 0,
      totalRisky: 0,
      totalOtor: 0,
      totalActive: 0,
      engagementPct: 0,
      avgReadPct: 0,
      lowReadBags: 0,
    };
  }
  const totalHouseholds = bags.reduce((s, b) => s + b.households, 0);
  const totalAnimals = bags.reduce((s, b) => s + b.animals, 0);
  const totalRisky = bags.reduce((s, b) => s + b.risky, 0);
  const totalOtor = bags.reduce((s, b) => s + b.otor, 0);
  const totalActive = bags.reduce((s, b) => s + b.active, 0);
  const avgReadPct = Math.round(
    bags.reduce((s, b) => s + b.readPct, 0) / bags.length
  );
  const engagementPct =
    totalHouseholds > 0 ? Math.round((totalActive / totalHouseholds) * 100) : 0;
  const lowReadBags = bags.filter((b) => b.readPct < 60).length;

  return {
    bagCount: bags.length,
    totalHouseholds,
    totalAnimals,
    totalRisky,
    totalOtor,
    totalActive,
    engagementPct,
    avgReadPct,
    lowReadBags,
  };
}

// -----------------------------------------------------------------------
// Ranking & filter
// -----------------------------------------------------------------------

export type BagRankCriterion = 'readPct' | 'engagement' | 'risky' | 'animals';

export function rankBags(
  bags: BagStat[],
  criterion: BagRankCriterion = 'readPct'
): BagStat[] {
  const sorted = [...bags];
  switch (criterion) {
    case 'readPct':
      return sorted.sort((a, b) => b.readPct - a.readPct);
    case 'engagement':
      return sorted.sort((a, b) => {
        const ea = a.households > 0 ? a.active / a.households : 0;
        const eb = b.households > 0 ? b.active / b.households : 0;
        return eb - ea;
      });
    case 'risky':
      // Хамгийн их risky эхэнд (анхаарах шаардлагатай)
      return sorted.sort((a, b) => b.risky - a.risky);
    case 'animals':
      return sorted.sort((a, b) => b.animals - a.animals);
  }
}

export function filterLowRead(bags: BagStat[], threshold = 60): BagStat[] {
  return bags.filter((b) => b.readPct < threshold);
}

export function bagEngagement(bag: BagStat): number {
  if (bag.households === 0) return 0;
  return Math.round((bag.active / bag.households) * 100);
}

// -----------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------

export function sortEventsByDate(events: SumEvent[]): SumEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function avgParticipation(events: SumEvent[]): number {
  if (events.length === 0) return 0;
  return Math.round(
    events.reduce((s, e) => s + e.participation, 0) / events.length
  );
}

export function lowParticipationEvents(
  events: SumEvent[],
  threshold = 60
): SumEvent[] {
  return events.filter((e) => e.participation < threshold);
}

// -----------------------------------------------------------------------
// Mock provider + backend swap point
// -----------------------------------------------------------------------

export function getMockBags(): BagStat[] {
  return [
    { id: '1', name: '1-р баг (Хараат)', households: 72, animals: 18400, active: 58, risky: 4, otor: 12, readPct: 82 },
    { id: '2', name: '2-р баг (Баян-Улаан)', households: 65, animals: 15200, active: 52, risky: 6, otor: 8, readPct: 76 },
    { id: '3', name: '3-р баг (Цагаан-Овоо)', households: 58, animals: 13800, active: 47, risky: 3, otor: 15, readPct: 88 },
    { id: '4', name: '4-р баг (Хөх-Гол)', households: 49, animals: 11500, active: 35, risky: 8, otor: 5, readPct: 60 },
    { id: '5', name: '5-р баг (Цэнгэг)', households: 62, animals: 14700, active: 51, risky: 4, otor: 10, readPct: 81 },
  ];
}

export function getMockEvents(): SumEvent[] {
  return [
    { id: '1', title: 'Хаврын тоолго', date: '2026-04-25', participation: 68 },
    { id: '2', title: 'Вакцинжуулалт', date: '2026-05-10', participation: 92 },
    { id: '3', title: 'Бэлчээр ашиглалтын хурал', date: '2026-05-15', participation: 45 },
  ];
}

import { sumDashboardApi } from './api';

// Backend → cache → mock fallback (contract frozen — backend-gaps.md §1.2).
export async function fetchSumBags(sumId?: string): Promise<BagStat[]> {
  if (!sumId) return getMockBags();
  try {
    return await sumDashboardApi.getBags(sumId);
  } catch {
    return getMockBags();
  }
}

export async function fetchSumEvents(sumId?: string): Promise<SumEvent[]> {
  if (!sumId) return getMockEvents();
  try {
    return await sumDashboardApi.getEvents(sumId);
  } catch {
    return getMockEvents();
  }
}
