// API contract freeze integration — data-layer fetch* нь real API-аас
// fail үед mock-руу falls-back болохыг шалгана. Backend endpoint
// бэлэн болмогц энэ тест-ийн bодит assertion солигдохгүй.

import { fetchBagHouseholds } from '../bag-dashboard-data';
import { fetchSumBags, fetchSumEvents } from '../sum-dashboard-data';
import { fetchLostFoundListings } from '../lost-found-data';
import { fetchOwnerSnapshot } from '../owner-dashboard-data';

// Global fetch undefined / reject — pure test env default тохиолдол.
// Хэрэв node-д fetch орсон бол rejected-оор дарж байна.
beforeAll(() => {
  (global as any).fetch = jest.fn(() =>
    Promise.reject(new Error('test-env: no network'))
  );
});
afterAll(() => {
  delete (global as any).fetch;
});

describe('api-contracts / bag dashboard', () => {
  it('bagId-гүй дуудсан үед mock эсэхийг заавал буцаана', async () => {
    const data = await fetchBagHouseholds();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('head');
  });

  it('bagId-тэй дуудсан ч network fail → mock fallback', async () => {
    const data = await fetchBagHouseholds('1');
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('api-contracts / sum dashboard', () => {
  it('sumId-гүй үед mock', async () => {
    const bags = await fetchSumBags();
    expect(bags.length).toBeGreaterThan(0);
    expect(bags[0]).toHaveProperty('readPct');
  });

  it('sumId-тэй үед network fail → mock fallback', async () => {
    const bags = await fetchSumBags('altanbulag');
    expect(bags.length).toBeGreaterThan(0);
  });

  it('events нь date-sorted state эсэхгүйгээр raw order-оор mock', async () => {
    const events = await fetchSumEvents('altanbulag');
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('date');
  });
});

describe('api-contracts / lost-found', () => {
  it('param-гүй үед бүх listing mock', async () => {
    const data = await fetchLostFoundListings();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('species');
    expect(data[0]).toHaveProperty('type');
  });

  it('type=lost filter дамжуулсан ч network fail → mock fallback', async () => {
    const data = await fetchLostFoundListings({ type: 'lost' });
    expect(data.length).toBeGreaterThan(0);
  });

  it('aimag/sum filter дамжуулсан ч mock fallback', async () => {
    const data = await fetchLostFoundListings({ aimag: 'Төв', sum: 'Алтанбулаг' });
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('api-contracts / owner dashboard', () => {
  it('snapshot network fail → mock fallback (8 хэсэгтэй)', async () => {
    const snap = await fetchOwnerSnapshot();
    expect(snap.growth).toBeDefined();
    expect(snap.revenue).toBeDefined();
    expect(snap.productUsage).toBeDefined();
    expect(snap.geography).toBeDefined();
    expect(snap.organizations).toBeDefined();
    expect(snap.billing).toBeDefined();
    expect(snap.moderation).toBeDefined();
    expect(snap.contentOps).toBeDefined();
  });
});
