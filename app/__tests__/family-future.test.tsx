import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FamilyFuture from '../family-future';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

describe('FamilyFuture', () => {
  it('header render', () => {
    const { getByText } = render(<FamilyFuture />);
    expect(getByText('Өрх ба ирээдүй')).toBeTruthy();
    expect(getByText(/Хүүхэд, боловсрол/)).toBeTruthy();
  });

  it('5 tab — Боловсрол, Тэтгэлэг, Санхүү, Чадвар, Бизнес', () => {
    const { getByText } = render(<FamilyFuture />);
    expect(getByText('Боловсрол')).toBeTruthy();
    expect(getByText('Тэтгэлэг')).toBeTruthy();
    expect(getByText('Өрхийн санхүү')).toBeTruthy();
    expect(getByText('Ур чадвар')).toBeTruthy();
    expect(getByText('Бизнес санаа')).toBeTruthy();
  });

  it('default (Боловсрол) tab — хүүхэд нэмэх + зайн сургалт', () => {
    const { getByText } = render(<FamilyFuture />);
    expect(getByText('+ Хүүхэд нэмэх')).toBeTruthy();
    expect(getByText(/E-Mongolia/)).toBeTruthy();
    expect(getByText(/Мянганы Сорилго/)).toBeTruthy();
  });

  it('Тэтгэлэг tab — 3 тэтгэлэг + материалын жагсаалт', () => {
    const { getByText } = render(<FamilyFuture />);
    fireEvent.press(getByText('Тэтгэлэг'));
    expect(getByText(/Малчдын хүүхдэд зориулсан/)).toBeTruthy();
    expect(getByText(/Мянганы сорилгын сан/)).toBeTruthy();
    expect(getByText(/Иргэний үнэмлэх/)).toBeTruthy();
  });

  it('Санхүү tab — 50/30/20 дүрэм + хадгаламж', () => {
    const { getByText } = render(<FamilyFuture />);
    fireEvent.press(getByText('Өрхийн санхүү'));
    expect(getByText(/50% — Хэрэгцээ/)).toBeTruthy();
    expect(getByText(/30% — Хүсэл/)).toBeTruthy();
    expect(getByText(/20% — Хадгаламж/)).toBeTruthy();
  });

  it('Ур чадвар tab — цахим мэдлэг + нэмэлт мэргэжил', () => {
    const { getByText } = render(<FamilyFuture />);
    fireEvent.press(getByText('Ур чадвар'));
    expect(getByText(/Цахим мэдлэг/)).toBeTruthy();
    expect(getByText(/Нэмэлт мэргэжил/)).toBeTruthy();
    expect(getByText(/Жолооны үнэмлэх/)).toBeTruthy();
  });

  it('Бизнес санаа tab — "Гэр буудал" business idea', () => {
    const { getByText } = render(<FamilyFuture />);
    fireEvent.press(getByText('Бизнес санаа'));
    expect(getByText('Гэр буудал')).toBeTruthy();
  });
});
