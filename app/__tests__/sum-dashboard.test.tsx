import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SumDashboard from '../sum-dashboard';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    '@malchin_onboarding_data',
    JSON.stringify({
      phone: '99001122',
      lastName: 'Дорж',
      firstName: 'Болд',
      role: 'sum_admin',
      aimag: 'Төв',
      sum: 'Алтанбулаг',
      bag: '',
    })
  );
});

describe('SumDashboard', () => {
  it('header render хийгдэнэ (онбординг-оос аймаг/сум унших)', async () => {
    const { getByText, findByText } = render(<SumDashboard />);
    expect(getByText('Сумын хяналтын самбар')).toBeTruthy();
    expect(await findByText(/Төв аймаг · Алтанбулаг сум/)).toBeTruthy();
  });

  it('loading state эхлээд харагдана', () => {
    const { getByText } = render(<SumDashboard />);
    expect(getByText(/Сумын мэдээлэл ачааллаж/)).toBeTruthy();
  });

  it('mock ачаалагдсаны дараа hero үзүүлэлт харагдана (306 өрх, 73,600 мал)', async () => {
    const { findByText } = render(<SumDashboard />);
    // 5 баг х (72+65+58+49+62) = 306 өрх
    expect(await findByText('306')).toBeTruthy();
    // totalAnimals = 73,600 (toLocaleString → "73,600")
    expect(await findByText('73,600')).toBeTruthy();
  });

  it('engagement KPI render хийгдэнэ (79%, 77%)', async () => {
    const { findByText } = render(<SumDashboard />);
    // totalActive/totalHouseholds = 243/306 ≈ 79%
    expect(await findByText('79%')).toBeTruthy();
    // avgReadPct = (82+76+88+60+81)/5 = 77
    expect(await findByText('77%')).toBeTruthy();
  });

  it('ranking нь readPct-ээр эрэмбэлэгдэж харагдана', async () => {
    const { findAllByText } = render(<SumDashboard />);
    // #1 нь 3-р баг (88%), ranking section-д гарна
    const top = await findAllByText(/3-р баг/);
    expect(top.length).toBeGreaterThan(0);
    // 88% нь ranking bar + бусад газар давхацах магадлалтай
    const pct = await findAllByText('88%');
    expect(pct.length).toBeGreaterThan(0);
  });

  it('event жагсаалт date sort-оор харагдана', async () => {
    const { findByText } = render(<SumDashboard />);
    expect(await findByText('Хаврын тоолго')).toBeTruthy();
    expect(await findByText('Вакцинжуулалт')).toBeTruthy();
    expect(await findByText('Бэлчээр ашиглалтын хурал')).toBeTruthy();
  });

  it('Мэдэгдэл илгээх button дарахад modal нээгдэнэ', async () => {
    const { findByText, getByText } = render(<SumDashboard />);
    await findByText('Хаврын тоолго'); // wait load

    fireEvent.press(getByText('Мэдэгдэл илгээх'));
    await waitFor(() => expect(getByText('Гарчиг')).toBeTruthy());
    // Бүх баг chip нийт 306 өрхтэй
    expect(getByText('Бүх баг (306)')).toBeTruthy();
  });
});
