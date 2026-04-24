import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MalchinKhun from '../malchin-khun';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

describe('MalchinKhun', () => {
  it('header render', () => {
    const { getByText } = render(<MalchinKhun />);
    expect(getByText('Малчин хүн')).toBeTruthy();
    expect(getByText(/Өөрийн эрүүл мэнд/)).toBeTruthy();
  });

  it('5 tab — Эрүүл мэнд, ЭМД/НДШ, Аюулгүй байдал, Сэтгэл санаа, Зуршил', () => {
    const { getByText } = render(<MalchinKhun />);
    expect(getByText('Эрүүл мэнд')).toBeTruthy();
    expect(getByText('ЭМД / НДШ')).toBeTruthy();
    expect(getByText(/Хөдөлмөрийн аюулгүй байдал/)).toBeTruthy();
    expect(getByText('Сэтгэл санаа')).toBeTruthy();
    expect(getByText('Өдрийн зуршил')).toBeTruthy();
  });

  it('default (Эрүүл мэнд) view — хуваарийн сануулга + эмийн сануулга render', () => {
    const { getByText } = render(<MalchinKhun />);
    expect(getByText(/Хуваарийн сануулга/)).toBeTruthy();
    expect(getByText('Жил тутмын биеийн үзлэг')).toBeTruthy();
    expect(getByText(/Эмийн сануулга/)).toBeTruthy();
    expect(getByText('+ Эм нэмэх')).toBeTruthy();
  });

  it('ЭМД tab-руу шилжих — статус + шимтгэл мэдээлэл', () => {
    const { getByText, queryByText } = render(<MalchinKhun />);
    fireEvent.press(getByText('ЭМД / НДШ'));
    expect(getByText(/3,600₮ \/ сар/)).toBeTruthy();
    expect(getByText(/11.5% × орлого/)).toBeTruthy();
    // Өмнөх tab content нуугдсан
    expect(queryByText('Жил тутмын биеийн үзлэг')).toBeNull();
  });

  it('Аюулгүй байдал tab — 3 яаралтай дуудлагын button', () => {
    const { getByText } = render(<MalchinKhun />);
    fireEvent.press(getByText(/Хөдөлмөрийн аюулгүй байдал/));
    expect(getByText(/103.*Түргэн тусламж/)).toBeTruthy();
    expect(getByText(/105.*Онцгой байдал/)).toBeTruthy();
    expect(getByText(/102.*Цагдаа/)).toBeTruthy();
  });

  it('Сэтгэл санаа tab — 108 зөвлөгөөний утас', () => {
    const { getByText } = render(<MalchinKhun />);
    fireEvent.press(getByText('Сэтгэл санаа'));
    expect(getByText(/108.*Сэтгэл зүйн утас/)).toBeTruthy();
    expect(getByText(/4-7-8 амьсгалын дасгал/)).toBeTruthy();
  });

  it('Зуршил tab — өглөө/унтах/тамир section', () => {
    const { getByText } = render(<MalchinKhun />);
    fireEvent.press(getByText('Өдрийн зуршил'));
    expect(getByText(/Өглөөний зуршил/)).toBeTruthy();
    expect(getByText(/Унтах зуршил/)).toBeTruthy();
    expect(getByText(/Биеийн тамир/)).toBeTruthy();
  });
});
