import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CoopDashboard from '../coop-dashboard';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

describe('CoopDashboard', () => {
  it('header render хийгдэнэ', () => {
    const { getByText } = render(<CoopDashboard />);
    expect(getByText('Хоршооны самбар')).toBeTruthy();
    expect(getByText(/120 гишүүн/)).toBeTruthy();
  });

  it('stats 4 тоо — гишүүн 120, шинэ 1, нийт кг 60, төлсөн 25%', () => {
    const { getByText } = render(<CoopDashboard />);
    expect(getByText('120')).toBeTruthy(); // гишүүн
    expect(getByText('1')).toBeTruthy(); // new orders
    // totalKg: 12+8+25+15 = 60
    expect(getByText('60')).toBeTruthy();
    // paid 1/4 = 25%
    expect(getByText('25%')).toBeTruthy();
  });

  it('нийт эргэлтийн дүн render хийгдэнэ', () => {
    const { getByText } = render(<CoopDashboard />);
    // 12*85000 + 8*85000 + 25*4500 + 15*85000 = 1,020,000 + 680,000 + 112,500 + 1,275,000 = 3,087,500
    expect(getByText(/3[,.]087[,.]500₮/)).toBeTruthy();
  });

  it('4 захиалга бүгд захиалгын урсгал-д харагдана', () => {
    const { getByText } = render(<CoopDashboard />);
    expect(getByText('Батбаяр.Б')).toBeTruthy();
    expect(getByText('Оюунтуяа.Д')).toBeTruthy();
    expect(getByText('Дорж.Т')).toBeTruthy();
    expect(getByText('Насанбат.Ц')).toBeTruthy();
  });

  it('зах зээлийн үнэ 4 мөр render', () => {
    const { getByText } = render(<CoopDashboard />);
    expect(getByText('Ямааны ноолуур A')).toBeTruthy();
    expect(getByText('Ямааны ноолуур B')).toBeTruthy();
    expect(getByText('Хонины ноос')).toBeTruthy();
    expect(getByText('Тэмээний ноос')).toBeTruthy();
  });

  it('"Үнэ зарлах" дарахад modal нээгдэнэ', async () => {
    const { getByText } = render(<CoopDashboard />);
    fireEvent.press(getByText('Үнэ зарлах'));
    await waitFor(() => {
      expect(getByText('Гишүүдэд үнэ зарлах')).toBeTruthy();
    });
    expect(getByText(/120 гишүүнд push мэдэгдэл/)).toBeTruthy();
  });
});
