import {
  validateListing,
  filterByType,
  filterByStatus,
  countActive,
  sortByDateDesc,
  matchScore,
  findPotentialMatches,
  getMockListings,
  buildListing,
  type Listing,
} from '../lost-found-data';

const lostHorse: Listing = {
  id: 'l1', type: 'lost', species: 'horse', count: 2, color: 'Хээр',
  age: '5-7 настай', brand: "Зүүн гуянд 'Х'", earTag: '',
  lastSeen: 'Алтанбулаг 3-р баг', phone: '99112233',
  date: '2026-04-22', status: 'active',
};

const foundHorse: Listing = {
  id: 'f1', type: 'found', species: 'horse', count: 1, color: 'Хээр',
  age: '6 настай', brand: "Зүүн гуянд 'Х'", earTag: '',
  lastSeen: 'Заамар', phone: '88224455',
  date: '2026-04-24', status: 'active',
};

const foundCowTagged: Listing = {
  id: 'f2', type: 'found', species: 'cow', count: 1, color: 'Алаг',
  age: '3 настай', brand: '', earTag: 'MN-12345',
  lastSeen: 'Цонжин-Болдог', phone: '99556677',
  date: '2026-04-21', status: 'active',
};

const lostCowTagged: Listing = {
  id: 'l2', type: 'lost', species: 'cow', count: 1, color: 'Алаг',
  age: '3 настай', brand: '', earTag: 'MN-12345',
  lastSeen: 'Улаанбаатар', phone: '99112233',
  date: '2026-04-18', status: 'active',
};

describe('validateListing', () => {
  it('бүрэн form → ok', () => {
    const r = validateListing(lostHorse);
    expect(r.ok).toBe(true);
  });

  it('species үгүй → алдаа', () => {
    const r = validateListing({ ...lostHorse, species: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'species')).toBe(true);
  });

  it('count = 0 → алдаа', () => {
    const r = validateListing({ ...lostHorse, count: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'count')).toBe(true);
  });

  it('lastSeen хоосон → алдаа', () => {
    const r = validateListing({ ...lostHorse, lastSeen: '   ' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'lastSeen')).toBe(true);
  });

  it('phone format буруу → алдаа', () => {
    const r = validateListing({ ...lostHorse, phone: '123' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'phone')).toBe(true);
  });

  it('phone орон зайтай ч normalized → ok', () => {
    const r = validateListing({ ...lostHorse, phone: '9911 2233' });
    expect(r.ok).toBe(true);
  });

  it('phone dash-тай ч normalized → ok', () => {
    const r = validateListing({ ...lostHorse, phone: '9911-2233' });
    expect(r.ok).toBe(true);
  });
});

describe('filterByType / filterByStatus / countActive', () => {
  const list: Listing[] = [
    lostHorse,
    foundHorse,
    { ...lostHorse, id: 'l3', status: 'resolved' },
    foundCowTagged,
  ];

  it('type-оор filter', () => {
    expect(filterByType(list, 'lost')).toHaveLength(2);
    expect(filterByType(list, 'found')).toHaveLength(2);
  });

  it('status-оор filter', () => {
    expect(filterByStatus(list, 'active')).toHaveLength(3);
    expect(filterByStatus(list, 'resolved')).toHaveLength(1);
  });

  it('countActive — active + type', () => {
    expect(countActive(list, 'lost')).toBe(1);
    expect(countActive(list, 'found')).toBe(2);
  });
});

describe('sortByDateDesc', () => {
  it('шинэ нь эхэнд', () => {
    const r = sortByDateDesc([
      { ...lostHorse, id: 'a', date: '2026-01-10' },
      { ...lostHorse, id: 'b', date: '2026-04-22' },
      { ...lostHorse, id: 'c', date: '2026-02-15' },
    ]);
    expect(r[0].id).toBe('b');
    expect(r[2].id).toBe('a');
  });

  it('хоосон array-тай ажиллана', () => {
    expect(sortByDateDesc([])).toEqual([]);
  });
});

describe('matchScore', () => {
  it('ижил type бол 0 (lost vs lost)', () => {
    const anotherLost: Listing = { ...lostHorse, id: 'l2' };
    expect(matchScore(lostHorse, anotherLost as any)).toBe(0);
  });

  it('өөр species бол 0', () => {
    const foundCow: Listing = { ...foundHorse, species: 'cow' };
    expect(matchScore(lostHorse, foundCow)).toBe(0);
  });

  it('earTag таарвал 1.0 (хүчтэй match)', () => {
    expect(matchScore(lostCowTagged, foundCowTagged)).toBe(1.0);
  });

  it('species + зүс + тамга + нас + огноо ойр → өндөр score', () => {
    const s = matchScore(lostHorse, foundHorse);
    expect(s).toBeGreaterThan(0.7);
  });

  it('зөвхөн species match → 0.3', () => {
    const plainFound: Listing = {
      ...foundHorse,
      color: 'Хар', brand: '', age: '', earTag: '',
      date: '2025-01-01', // хол огноо
    };
    expect(matchScore(lostHorse, plainFound)).toBeCloseTo(0.3, 2);
  });

  it('тамгын үсэг ижил байвал хэсэгчилсэн match', () => {
    const a: Listing = { ...lostHorse, brand: "зүүн гуянд 'Х'" };
    const b: Listing = { ...foundHorse, brand: "баруун гуянд 'Х'" };
    const s = matchScore(a, b);
    // species (0.3) + зүс (0.25) + brand letter (0.2) + нас ойрхон (0.1) + дөт хугацаа (0.15)
    expect(s).toBeGreaterThan(0.75);
  });
});

describe('findPotentialMatches', () => {
  const universe: Listing[] = [
    lostHorse, foundHorse, foundCowTagged, lostCowTagged,
    { ...foundHorse, id: 'f3', color: 'Хар' }, // ижил species өөр зүс
  ];

  it('lost → found-уудаас боломжит match', () => {
    const r = findPotentialMatches(lostHorse, universe);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].listing.type).toBe('found');
    expect(r[0].listing.id).toBe('f1'); // хамгийн өндөр score
  });

  it('earTag match → 1.0 score эхэнд', () => {
    const r = findPotentialMatches(lostCowTagged, universe);
    expect(r[0].listing.id).toBe('f2');
    expect(r[0].score).toBe(1.0);
  });

  it('threshold хангахгүй бол хасагдана', () => {
    // Зөвхөн earTag-тэй ижил 1.0 score-тай match хэрэгтэй — lostHorse-д earTag үгүй
    const r = findPotentialMatches(lostHorse, universe, 0.99);
    expect(r.length).toBe(0);
  });

  it('өөрийгөө exclude', () => {
    const r = findPotentialMatches(lostHorse, universe);
    expect(r.find((x) => x.listing.id === lostHorse.id)).toBeUndefined();
  });
});

describe('getMockListings + buildListing', () => {
  it('mock listing-ууд валид schema-тай', () => {
    const list = getMockListings();
    expect(list.length).toBeGreaterThan(0);
    for (const l of list) {
      expect(validateListing(l).ok).toBe(true);
      expect(['lost', 'found']).toContain(l.type);
      expect(['active', 'resolved', 'pending']).toContain(l.status);
    }
  });

  it('buildListing нь id + date + status бөглөнө', () => {
    const out = buildListing({
      type: 'found', species: 'horse', count: 1, color: 'Хээр',
      age: '5', brand: '', earTag: '', lastSeen: 'X', phone: '99112233',
    });
    expect(out.id).toBeTruthy();
    expect(out.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out.status).toBe('active');
  });
});
