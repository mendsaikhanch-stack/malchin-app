import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BagDashboard from '../bag-dashboard';

// expo-router mock
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

// Онбординг snapshot — dashboard нь хэрэглэгчийн бодит баг/сум-аас уншина
beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    '@malchin_onboarding_data',
    JSON.stringify({
      phone: '99001122',
      lastName: 'Баатарын',
      firstName: 'Батболд',
      role: 'bag_darga',
      aimag: 'Төв',
      sum: 'Алтанбулаг',
      bag: '3-р баг',
    })
  );
});

describe('BagDashboard', () => {
  it('header render хийгдэнэ (онбординг-оос сум/баг унших)', async () => {
    const { getByText, findByText } = render(<BagDashboard />);
    expect(getByText('Багийн даргын самбар')).toBeTruthy();
    expect(await findByText(/Алтанбулаг сум, 3-р баг/)).toBeTruthy();
  });

  it('loading state эхлээд харагдана', () => {
    const { getByText } = render(<BagDashboard />);
    expect(getByText(/Өрхийн мэдээлэл ачааллаж/)).toBeTruthy();
  });

  it('mock 6 өрх ачаалагдсаны дараа stats харагдана', async () => {
    const { findByText } = render(<BagDashboard />);
    // "Бүх өрх (6)" text heading
    const heading = await findByText('👪 Бүх өрх (6)');
    expect(heading).toBeTruthy();
  });

  it('ачаалагдсаны дараа өрхийн нэр харагдана', async () => {
    const { findAllByText } = render(<BagDashboard />);
    // Нэр нь risky + бүх өрх section-д давхардаж гарах магадлалтай
    const names = await findAllByText('Батбаяр.Б');
    expect(names.length).toBeGreaterThan(0);
  });

  it('эрсдэлт өрх section харагдана (score-based)', async () => {
    const { findAllByText } = render(<BagDashboard />);
    // Мөнхбаяр.О: 10 өдөр → score=2 → medium risk → risky section + all section
    const items = await findAllByText('Мөнхбаяр.О');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('Мэдэгдэл илгээх button дарахад modal нээгдэнэ', async () => {
    const { findAllByText, getByText } = render(<BagDashboard />);
    await findAllByText('Батбаяр.Б'); // wait for load

    fireEvent.press(getByText('Мэдэгдэл илгээх'));
    // Modal дотор "Гарчиг" label
    await waitFor(() => expect(getByText('Гарчиг')).toBeTruthy());
  });
});
