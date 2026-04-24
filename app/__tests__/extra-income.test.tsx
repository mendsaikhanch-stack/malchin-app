import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExtraIncome from '../extra-income';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

describe('ExtraIncome', () => {
  it('header render', () => {
    const { getByText } = render(<ExtraIncome />);
    expect(getByText('Нэмэлт орлого')).toBeTruthy();
    expect(getByText(/Малаас гадна/)).toBeTruthy();
  });

  it('6 ангилал бүгд grid-д render хийгдэнэ', () => {
    const { getByText } = render(<ExtraIncome />);
    expect(getByText('Гэр буудал')).toBeTruthy();
    expect(getByText('Цагаан идээ')).toBeTruthy();
    expect(getByText('Мах борц')).toBeTruthy();
    expect(getByText('Гар урлал')).toBeTruthy();
    expect(getByText('Морин аялал')).toBeTruthy();
    expect(getByText('Үйлчилгээ')).toBeTruthy();
  });

  it('default empty state харагдана (зар байхгүй)', () => {
    const { getByText } = render(<ExtraIncome />);
    expect(getByText(/Одоогоор зарласан зүйл алга/)).toBeTruthy();
    expect(getByText(/Дээрээс нэг ангилал сонгож/)).toBeTruthy();
  });

  it('2 амжилтын жишээ story render', () => {
    const { getByText } = render(<ExtraIncome />);
    expect(getByText(/Оюуна — Хархорум/)).toBeTruthy();
    expect(getByText(/Бат-Эрдэнэ — Төв/)).toBeTruthy();
  });

  it('ангилал дарахад modal нээгдэнэ (ангилал гарчигтай)', async () => {
    const { getByText } = render(<ExtraIncome />);
    fireEvent.press(getByText('Гэр буудал'));
    await waitFor(() => {
      expect(getByText(/Гэр буудал — шинэ зар/)).toBeTruthy();
    });
  });

  it('form submit хоосон талбартай Alert үүсгэнэ', async () => {
    const { getByText } = render(<ExtraIncome />);
    fireEvent.press(getByText('Цагаан идээ'));
    await waitFor(() => expect(getByText(/Цагаан идээ — шинэ зар/)).toBeTruthy());
    // "Хадгалах" дарахад хоосон → Alert дуудагдана
    fireEvent.press(getByText('Хадгалах'));
    // Modal хэвээр нээлттэй, submit-гүй
    expect(getByText(/Цагаан идээ — шинэ зар/)).toBeTruthy();
  });

  it('form гүйцэд бөглөхөд зар жагсаалтанд нэмэгдэнэ', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<ExtraIncome />);
    fireEvent.press(getByText('Морин аялал'));
    await waitFor(() => expect(getByText(/Морин аялал — шинэ зар/)).toBeTruthy());

    fireEvent.changeText(
      getByPlaceholderText(/Цэнгэг хөндий гэр/),
      '3 өдрийн морин аялал'
    );
    fireEvent.changeText(
      getByPlaceholderText(/Хоногт 80/),
      'Хоногт 120,000₮'
    );
    fireEvent.press(getByText('Хадгалах'));

    await waitFor(() => {
      expect(queryByText(/Морин аялал — шинэ зар/)).toBeNull(); // modal хаагдсан
    });
    expect(getByText('3 өдрийн морин аялал')).toBeTruthy();
    expect(getByText(/Хоногт 120,000₮/)).toBeTruthy();
  });
});
