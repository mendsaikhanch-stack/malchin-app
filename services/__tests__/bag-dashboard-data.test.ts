import {
  computeHouseholdRisk,
  computeBagStats,
  filterRisky,
  filterOtor,
  sortByLastActive,
  parseLastActiveDays,
  getMockHouseholds,
  RISK_LABEL,
  type Household,
} from '../bag-dashboard-data';

describe('parseLastActiveDays', () => {
  it('"Өнөөдөр" → 0', () => {
    expect(parseLastActiveDays('Өнөөдөр')).toBe(0);
    expect(parseLastActiveDays('today')).toBe(0);
  });

  it('"N өдрийн өмнө" → N', () => {
    expect(parseLastActiveDays('2 өдрийн өмнө')).toBe(2);
    expect(parseLastActiveDays('10 өдрийн өмнө')).toBe(10);
  });

  it('тодорхойгүй label → 0 fallback', () => {
    expect(parseLastActiveDays('')).toBe(0);
    expect(parseLastActiveDays('унших боломжгүй')).toBe(0);
  });
});

describe('computeHouseholdRisk', () => {
  it('идэвхтэй + оторгүй → low', () => {
    expect(
      computeHouseholdRisk({ lastActiveDays: 0, otor: false })
    ).toBe('low');
  });

  it('1-2 өдөр идэвхгүй → low', () => {
    expect(
      computeHouseholdRisk({ lastActiveDays: 2, otor: false })
    ).toBe('low');
  });

  it('3-6 өдөр идэвхгүй → medium', () => {
    expect(
      computeHouseholdRisk({ lastActiveDays: 5, otor: false })
    ).toBe('medium');
  });

  it('7+ өдөр идэвхгүй → medium', () => {
    // 7+ бол score = 2 → medium
    expect(
      computeHouseholdRisk({ lastActiveDays: 10, otor: false })
    ).toBe('medium');
  });

  it('7+ өдөр + отор → high', () => {
    // 2 + 1 = 3 → high
    expect(
      computeHouseholdRisk({ lastActiveDays: 10, otor: true })
    ).toBe('high');
  });

  it('3-6 өдөр + отор → medium (score=2)', () => {
    expect(
      computeHouseholdRisk({ lastActiveDays: 5, otor: true })
    ).toBe('medium');
  });

  it('backend-аас high hint → high болно', () => {
    expect(
      computeHouseholdRisk({
        lastActiveDays: 0,
        otor: false,
        backendRiskHint: 'high',
      })
    ).toBe('medium'); // score = 2
    expect(
      computeHouseholdRisk({
        lastActiveDays: 3,
        otor: false,
        backendRiskHint: 'high',
      })
    ).toBe('high'); // score = 3
  });

  it('backend medium hint + идэвхгүй → high', () => {
    expect(
      computeHouseholdRisk({
        lastActiveDays: 7,
        otor: false,
        backendRiskHint: 'medium',
      })
    ).toBe('high'); // 2 + 1 = 3
  });
});

describe('computeBagStats', () => {
  const sample: Household[] = [
    {
      id: '1', head: 'A', phone: '', members: 1, animals: 100, location: '',
      lastActive: 'Өнөөдөр', lastActiveDays: 0, risk: 'low', otor: false,
    },
    {
      id: '2', head: 'B', phone: '', members: 1, animals: 200, location: '',
      lastActive: '5 өдрийн өмнө', lastActiveDays: 5, risk: 'medium', otor: false,
    },
    {
      id: '3', head: 'C', phone: '', members: 1, animals: 300, location: '',
      lastActive: '10 өдрийн өмнө', lastActiveDays: 10, risk: 'high', otor: true,
    },
  ];

  it('тоон нэгдэл зөв', () => {
    const s = computeBagStats(sample);
    expect(s.totalHouseholds).toBe(3);
    expect(s.totalAnimals).toBe(600);
  });

  it('risky + otor', () => {
    const s = computeBagStats(sample);
    expect(s.riskyCount).toBe(2);    // medium + high
    expect(s.otorCount).toBe(1);
    expect(s.mediumRisk).toBe(1);
    expect(s.highRisk).toBe(1);
  });

  it('7+ өдөр идэвхгүй', () => {
    expect(computeBagStats(sample).inactive7Days).toBe(1);
  });

  it('хоосон array', () => {
    const s = computeBagStats([]);
    expect(s.totalHouseholds).toBe(0);
    expect(s.totalAnimals).toBe(0);
    expect(s.riskyCount).toBe(0);
  });
});

describe('filterRisky — high эхэнд, lastActiveDays desc', () => {
  const list: Household[] = [
    { id: '1', head: 'Low', phone: '', members: 1, animals: 10, location: '', lastActive: 'Өнөөдөр', lastActiveDays: 0, risk: 'low', otor: false },
    { id: '2', head: 'Medium-old', phone: '', members: 1, animals: 10, location: '', lastActive: '5 өдөр', lastActiveDays: 5, risk: 'medium', otor: false },
    { id: '3', head: 'High-new', phone: '', members: 1, animals: 10, location: '', lastActive: '3 өдөр', lastActiveDays: 3, risk: 'high', otor: true },
    { id: '4', head: 'Medium-new', phone: '', members: 1, animals: 10, location: '', lastActive: '3 өдөр', lastActiveDays: 3, risk: 'medium', otor: false },
  ];

  it('low-ийг хасна', () => {
    const r = filterRisky(list);
    expect(r.find((h) => h.risk === 'low')).toBeUndefined();
  });

  it('high эхлэлд байна', () => {
    const r = filterRisky(list);
    expect(r[0].risk).toBe('high');
  });

  it('medium-уудын дотор хуучин нь түрүүнд', () => {
    const r = filterRisky(list);
    const mediums = r.filter((h) => h.risk === 'medium');
    expect(mediums[0].lastActiveDays).toBeGreaterThanOrEqual(mediums[1]?.lastActiveDays ?? 0);
  });
});

describe('filterOtor', () => {
  it('зөвхөн оторт гарсан өрхүүд', () => {
    const hs = getMockHouseholds();
    const ot = filterOtor(hs);
    expect(ot.every((h) => h.otor)).toBe(true);
    expect(ot.length).toBeGreaterThan(0);
  });
});

describe('sortByLastActive — хамгийн шинэ идэвхтэй эхэнд', () => {
  it('lastActiveDays ascending', () => {
    const hs = getMockHouseholds();
    const sorted = sortByLastActive(hs);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].lastActiveDays).toBeGreaterThanOrEqual(sorted[i - 1].lastActiveDays);
    }
  });
});

describe('getMockHouseholds', () => {
  it('байнга тогтмол 6 өрх', () => {
    expect(getMockHouseholds()).toHaveLength(6);
  });

  it('бүх өрхийн risk тооцоологдсон (inline биш, helper-ээр)', () => {
    const hs = getMockHouseholds();
    for (const h of hs) {
      expect(['low', 'medium', 'high']).toContain(h.risk);
      expect(h.lastActiveDays).toBeGreaterThanOrEqual(0);
    }
  });

  it('оторт гарсан өрх дор хаяж 1', () => {
    const hs = getMockHouseholds();
    expect(hs.some((h) => h.otor)).toBe(true);
  });
});

describe('RISK_LABEL — бүгд Монгол', () => {
  it('low/medium/high label бэлэн', () => {
    expect(RISK_LABEL.low).toBeTruthy();
    expect(RISK_LABEL.medium).toBeTruthy();
    expect(RISK_LABEL.high).toBeTruthy();
  });
});
