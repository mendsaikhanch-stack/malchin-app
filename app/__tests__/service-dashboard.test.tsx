import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ServiceDashboard from '../service-dashboard';

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

// Linking.openURL-г silent болгоно
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

describe('ServiceDashboard', () => {
  it('header render хийгдэнэ', () => {
    const { getByText } = render(<ServiceDashboard />);
    expect(getByText('Үйлчилгээний самбар')).toBeTruthy();
    expect(getByText(/Мал эмч.*Баатар/)).toBeTruthy();
  });

  it('stats 3 тоо: pending=1, today=2, revenue=180К', () => {
    const { getByText } = render(<ServiceDashboard />);
    // pending: 1 (Батбаяр)
    expect(getByText('1')).toBeTruthy();
    // today (2026-04-23): 2 (Батбаяр + Оюунтуяа)
    expect(getByText('2')).toBeTruthy();
    // revenue — done=180,000 → 180К₮
    expect(getByText('180К₮')).toBeTruthy();
  });

  it('default "Бүгд" filter 4 booking бүгдийг харуулна', () => {
    const { getByText } = render(<ServiceDashboard />);
    expect(getByText('Батбаяр.Б')).toBeTruthy();
    expect(getByText('Оюунтуяа.Д')).toBeTruthy();
    expect(getByText('Дорж.Т')).toBeTruthy();
    expect(getByText('Насанбат.Ц')).toBeTruthy();
  });

  it('"Хүлээгдэж" filter нь зөвхөн pending booking харуулна', () => {
    const { getAllByText, getByText, queryByText } = render(<ServiceDashboard />);
    // "Хүлээгдэж" — filter chip + badge давхацна, эхнийх нь chip
    const chip = getAllByText('Хүлээгдэж')[0];
    fireEvent.press(chip);
    expect(getByText('Батбаяр.Б')).toBeTruthy();
    expect(queryByText('Оюунтуяа.Д')).toBeNull(); // accepted
    expect(queryByText('Насанбат.Ц')).toBeNull(); // done
  });

  it('pending booking-д "Хүлээн авах" дарахад status→accepted', async () => {
    const { getByText, getAllByText } = render(<ServiceDashboard />);
    // Эхлэх үед "Хүлээн авсан" filter chip (1) + 2 accepted booking badge = 3
    const initial = getAllByText('Хүлээн авсан').length;
    fireEvent.press(getByText('✓ Хүлээн авах'));
    await waitFor(() => {
      // +1 badge нэмэгдэнэ
      expect(getAllByText('Хүлээн авсан').length).toBe(initial + 1);
    });
  });

  it('accepted booking-д "Дууссан" дарахад status→done', async () => {
    const { getAllByText } = render(<ServiceDashboard />);
    const doneBtns = getAllByText('✓ Дууссан');
    const initialDoneCount = getAllByText('Дууссан').filter(
      // filter chip биш, badge статусыг хайгаад зөвхөн status-ыг тоолох
      (n) => n.props.children === 'Дууссан'
    ).length;
    // Эхний accepted-ийн "Дууссан" button-ыг дарна
    fireEvent.press(doneBtns[0]);
    await waitFor(() => {
      const after = getAllByText('Дууссан').filter(
        (n) => n.props.children === 'Дууссан'
      ).length;
      expect(after).toBeGreaterThan(initialDoneCount);
    });
  });

  it('fab "Үйлчилгээний тохиргоо" button render хийгдэнэ', () => {
    const { getByText } = render(<ServiceDashboard />);
    expect(getByText(/Үйлчилгээний тохиргоо/)).toBeTruthy();
  });
});
