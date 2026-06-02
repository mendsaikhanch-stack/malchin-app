import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OwnerDashboard from '../owner';
import { getMockOwnerSnapshot } from '@/services/owner-dashboard-data';
import { getConfiguredPasscodeForTest, setAdminToken } from '@/services/admin-auth';

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

// Admin token-той seed хийнэ — дашбоард UI-руу шууд орох
async function seedAdminAuth() {
  await setAdminToken(`admin:${Date.now()}:test1234`);
}

describe('OwnerDashboard — web (full render)', () => {
  beforeEach(async () => {
    setPlatform('web');
    await AsyncStorage.clear();
    await seedAdminAuth();
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
  beforeEach(async () => {
    setPlatform('ios');
    await AsyncStorage.clear();
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

describe('OwnerDashboard — auth gate (web)', () => {
  beforeEach(async () => {
    setPlatform('web');
    await AsyncStorage.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(getMockOwnerSnapshot());
  });

  it('Token байхгүй үед locked screen — "Нэвтрэх код" form харагдана', async () => {
    const { findByPlaceholderText, getByText } = render(<OwnerDashboard />);
    expect(await findByPlaceholderText('Нэвтрэх код')).toBeTruthy();
    expect(getByText(/Нэвтрэх$/)).toBeTruthy();
  });

  it('Locked үед fetchOwnerSnapshot ДУУДАГДАХГҮЙ', async () => {
    const { findByPlaceholderText } = render(<OwnerDashboard />);
    await findByPlaceholderText('Нэвтрэх код');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Буруу passcode → "Нэвтрэх кодын алдаа" харагдана, locked хэвээр', async () => {
    const { findByPlaceholderText, findByText, getByText } = render(<OwnerDashboard />);
    const input = await findByPlaceholderText('Нэвтрэх код');
    fireEvent.changeText(input, 'wrong-passcode');
    fireEvent.press(getByText(/Нэвтрэх$/));
    expect(await findByText('Нэвтрэх кодын алдаа')).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Зөв passcode → token хадгалагдаж dashboard рендерлэгдэнэ', async () => {
    const { findByPlaceholderText, findByText, getByText } = render(<OwnerDashboard />);
    const input = await findByPlaceholderText('Нэвтрэх код');
    fireEvent.changeText(input, getConfiguredPasscodeForTest());
    fireEvent.press(getByText(/Нэвтрэх$/));
    // "Хэн?" нь зөвхөн dashboard single-glance ribbon-д байна (login screen-д БАЙХГҮЙ)
    expect(await findByText('Хэн?')).toBeTruthy();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  });

  it('Pre-seeded token → шууд dashboard (login screen алгасна)', async () => {
    await seedAdminAuth();
    const { findByText, queryByPlaceholderText } = render(<OwnerDashboard />);
    expect(await findByText('Owner dashboard')).toBeTruthy();
    expect(queryByPlaceholderText('Нэвтрэх код')).toBeNull();
  });

  it('"Гарах" товч → token clear, locked screen-руу буцна', async () => {
    await seedAdminAuth();
    const { findByText, getByText, findByPlaceholderText } = render(<OwnerDashboard />);
    await findByText('Owner dashboard');
    fireEvent.press(getByText('Гарах'));
    expect(await findByPlaceholderText('Нэвтрэх код')).toBeTruthy();
  });
});
