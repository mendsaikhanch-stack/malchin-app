import {
  computeSumStats,
  rankBags,
  filterLowRead,
  bagEngagement,
  sortEventsByDate,
  avgParticipation,
  lowParticipationEvents,
  getMockBags,
  getMockEvents,
  type BagStat,
  type SumEvent,
} from '../sum-dashboard-data';

const sample: BagStat[] = [
  { id: '1', name: 'A', households: 100, animals: 10000, active: 80, risky: 5, otor: 10, readPct: 90 },
  { id: '2', name: 'B', households: 50, animals: 5000, active: 25, risky: 10, otor: 5, readPct: 50 },
  { id: '3', name: 'C', households: 80, animals: 8000, active: 60, risky: 3, otor: 20, readPct: 75 },
];

describe('computeSumStats', () => {
  it('нийлүүлсэн тоон нэгдэл', () => {
    const s = computeSumStats(sample);
    expect(s.bagCount).toBe(3);
    expect(s.totalHouseholds).toBe(230);
    expect(s.totalAnimals).toBe(23000);
    expect(s.totalRisky).toBe(18);
    expect(s.totalOtor).toBe(35);
    expect(s.totalActive).toBe(165);
  });

  it('engagementPct = totalActive / totalHouseholds', () => {
    const s = computeSumStats(sample);
    // 165/230 ≈ 71.7% → 72
    expect(s.engagementPct).toBe(72);
  });

  it('avgReadPct', () => {
    const s = computeSumStats(sample);
    // (90+50+75)/3 = 71.67 → 72
    expect(s.avgReadPct).toBe(72);
  });

  it('lowReadBags — readPct<60', () => {
    expect(computeSumStats(sample).lowReadBags).toBe(1);
  });

  it('хоосон array → зero defaults', () => {
    const s = computeSumStats([]);
    expect(s.bagCount).toBe(0);
    expect(s.engagementPct).toBe(0);
    expect(s.avgReadPct).toBe(0);
  });
});

describe('rankBags', () => {
  it('readPct desc default', () => {
    const r = rankBags(sample);
    expect(r.map((b) => b.id)).toEqual(['1', '3', '2']);
  });

  it('engagement criterion', () => {
    // A: 80/100=80%, B: 25/50=50%, C: 60/80=75%
    const r = rankBags(sample, 'engagement');
    expect(r.map((b) => b.id)).toEqual(['1', '3', '2']);
  });

  it('risky criterion — хамгийн олон risky эхэнд', () => {
    const r = rankBags(sample, 'risky');
    expect(r[0].id).toBe('2'); // 10 risky
  });

  it('animals criterion', () => {
    const r = rankBags(sample, 'animals');
    expect(r.map((b) => b.id)).toEqual(['1', '3', '2']);
  });

  it('оригинал массивыг өөрчлөхгүй', () => {
    const copy = [...sample];
    rankBags(sample, 'readPct');
    expect(sample).toEqual(copy);
  });
});

describe('filterLowRead / bagEngagement', () => {
  it('default threshold 60', () => {
    expect(filterLowRead(sample)).toHaveLength(1);
  });

  it('custom threshold', () => {
    expect(filterLowRead(sample, 80)).toHaveLength(2);
  });

  it('bagEngagement — households=0 → 0', () => {
    expect(bagEngagement({ ...sample[0], households: 0, active: 10 })).toBe(0);
  });

  it('bagEngagement — зөв тооцоолол', () => {
    expect(bagEngagement(sample[0])).toBe(80);
  });
});

describe('Events', () => {
  const events: SumEvent[] = [
    { id: '1', title: 'A', date: '2026-05-10', participation: 80 },
    { id: '2', title: 'B', date: '2026-04-25', participation: 50 },
    { id: '3', title: 'C', date: '2026-05-15', participation: 95 },
  ];

  it('sortEventsByDate — хамгийн эрт эхэнд', () => {
    const r = sortEventsByDate(events);
    expect(r.map((e) => e.id)).toEqual(['2', '1', '3']);
  });

  it('avgParticipation', () => {
    // (80+50+95)/3 = 75
    expect(avgParticipation(events)).toBe(75);
  });

  it('avgParticipation — хоосон → 0', () => {
    expect(avgParticipation([])).toBe(0);
  });

  it('lowParticipationEvents — бага оролцоотой event', () => {
    const low = lowParticipationEvents(events);
    expect(low).toHaveLength(1);
    expect(low[0].id).toBe('2');
  });
});

describe('getMockBags / getMockEvents', () => {
  it('5 mock баг', () => {
    expect(getMockBags()).toHaveLength(5);
  });

  it('3 mock event', () => {
    expect(getMockEvents()).toHaveLength(3);
  });

  it('mock баг бүгд валид schema-тай', () => {
    for (const b of getMockBags()) {
      expect(b.households).toBeGreaterThan(0);
      expect(b.readPct).toBeGreaterThanOrEqual(0);
      expect(b.readPct).toBeLessThanOrEqual(100);
    }
  });
});
