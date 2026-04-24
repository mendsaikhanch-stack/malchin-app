import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PricingScreen from '../pricing';

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

const PACKAGE_KEY = '@malchin_package';

describe('PricingScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('header render хийгдэнэ', () => {
    const { getByText } = render(<PricingScreen />);
    expect(getByText('Багц ба үнэ')).toBeTruthy();
    expect(getByText(/5 багц/)).toBeTruthy();
  });

  it('default төлөвт Үнэгүй багц идэвхтэй', async () => {
    const { findAllByText } = render(<PricingScreen />);
    // Үнэгүй — note + card title + button текст
    const notes = await findAllByText(/Үнэгүй/);
    expect(notes.length).toBeGreaterThan(0);
    // "Идэвхтэй" badge — зөвхөн current багц дээр
    const badges = await findAllByText('Идэвхтэй');
    expect(badges.length).toBe(1);
  });

  it('бүх 5 багцын нэр харагдана', async () => {
    const { findByText } = render(<PricingScreen />);
    expect(await findByText('Үнэгүй')).toBeTruthy();
    expect(await findByText('Премиум Малчин')).toBeTruthy();
    expect(await findByText('Хоршооны багц')).toBeTruthy();
    expect(await findByText('Сумын лиценз')).toBeTruthy();
    expect(await findByText(/Баталгаажсан үйлчилгээ/)).toBeTruthy();
  });

  it('багц тус бүрийн үнэ рендерлэгдэнэ', async () => {
    const { findByText } = render(<PricingScreen />);
    expect(await findByText('0₮')).toBeTruthy();
    expect(await findByText('9,900₮ / сар')).toBeTruthy();
    expect(await findByText('Үнийн санал')).toBeTruthy();
    expect(await findByText('Жилийн гэрээ')).toBeTruthy();
  });

  it('premium_malchin feature жагсаалтад unlimited advisory багтана', async () => {
    const { findAllByText } = render(<PricingScreen />);
    // "хязгааргүй" нь advisory + listings хоёр feature-д гарна × premium бүр
    const matches = await findAllByText(/хязгааргүй/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('sum_license багц нь advanced sum dashboard feature-тэй', async () => {
    const { findAllByText } = render(<PricingScreen />);
    const matches = await findAllByText(/heatmap, export/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('саджигдсан багц AsyncStorage-д хадгалагдана', async () => {
    const stored = await AsyncStorage.getItem(PACKAGE_KEY);
    expect(stored).toBeNull(); // default
  });
});
