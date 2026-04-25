import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import OwnerDashboard from '../owner';
import { getMockOwnerSnapshot } from '@/services/owner-dashboard-data';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

// fetchOwnerSnapshot-ыг mock хийж, ownerApi туслдахгүй deterministic.
jest.mock('@/services/owner-dashboard-data', () => {
  const actual = jest.requireActual('@/services/owner-dashboard-data');
  return {
    ...actual,
    fetchOwnerSnapshot: jest.fn(),
  };
});

import { fetchOwnerSnapshot } from '@/services/owner-dashboard-data';
const mockFetch = fetchOwnerSnapshot as jest.MockedFunction<typeof fetchOwnerSnapshot>;

function setPlatform(os: 'web' | 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

describe('OwnerDashboard — web (full render)', () => {
  beforeEach(() => {
    setPlatform('web');
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(getMockOwnerSnapshot());
  });

  it('header нь "Owner dashboard"', async () => {
    const { findByText } = render(<OwnerDashboard />);
    expect(await findByText('Owner dashboard')).toBeTruthy();
  });

  it('single-glance ribbon — 6 locked асуулт харагдана', async () => {
    const { findByText, getByText } = render(<OwnerDashboard />);
    await findByText('Owner dashboard');
    expect(getByText('Хэн?')).toBeTruthy();
    expect(getByText('Хаанаас?')).toBeTruthy();
    expect(getByText('Яаж?')).toBeTruthy();
    expect(getByText('Хэн төлж?')).toBeTruthy();
    expect(getByText('Аль багц үнэтэй?')).toBeTruthy();
    expect(getByText('Аль аймаг идэвхтэй?')).toBeTruthy();
  });

  it('mock snapshot — alarm байхгүй "✓ Бүх 5 threshold normal" харагдана', async () => {
    const { findByText } = render(<OwnerDashboard />);
    expect(await findByText(/Бүх 5 threshold normal/)).toBeTruthy();
  });

  it('8 section гарчиг бүгд харагдана', async () => {
    const { findByText, getByText } = render(<OwnerDashboard />);
    await findByText('Owner dashboard');
    expect(getByText(/Growth/)).toBeTruthy();
    expect(getByText(/Revenue/)).toBeTruthy();
    expect(getByText(/Product usage/)).toBeTruthy();
    expect(getByText(/Geography/)).toBeTruthy();
    expect(getByText(/Organizations/)).toBeTruthy();
    expect(getByText(/Payments & billing/)).toBeTruthy();
    expect(getByText(/Moderation & trust/)).toBeTruthy();
    expect(getByText(/Content operations/)).toBeTruthy();
  });

  it('top аймаг "Төв" single-glance-д харагдана', async () => {
    const { findAllByText } = render(<OwnerDashboard />);
    // "Төв" нь glance ribbon + Geography section-д хоёр газар гарна
    const matches = await findAllByText('Төв');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('alarm trigger үед "⚠ Сэрэмжлүүлэг" харагдана', async () => {
    const snap = getMockOwnerSnapshot();
    snap.revenue = { ...snap.revenue, churnedThisMonth: 50 }; // 16% — alarm
    snap.contentOps = { ...snap.contentOps, inReview: 30, avgReviewHours: 20 }; // 600h — alarm
    mockFetch.mockResolvedValue(snap);

    const { findByText } = render(<OwnerDashboard />);
    expect(await findByText(/Сэрэмжлүүлэг/)).toBeTruthy();
  });
});

describe('OwnerDashboard — native (placeholder fallback)', () => {
  beforeEach(() => {
    setPlatform('ios');
    mockFetch.mockReset();
  });

  afterAll(() => setPlatform('web'));

  it('Native үед "Веб админ зөвхөн" placeholder харагдана', () => {
    const { getByText } = render(<OwnerDashboard />);
    expect(getByText('Веб админ зөвхөн')).toBeTruthy();
  });

  it('Native үед fetchOwnerSnapshot ДУУДАГДАХГҮЙ', () => {
    render(<OwnerDashboard />);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
