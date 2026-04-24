import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AdvisoryScreen from '../advisory';

// expo-router mock (jest-expo preset-д useRouter auto-mock биш)
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('AdvisoryScreen', () => {
  it('header + subtitle харагдана', () => {
    const { getByText } = render(<AdvisoryScreen />);
    expect(getByText('Ухаалаг зөвлөгөө')).toBeTruthy();
    expect(getByText(/15 бэлэн асуулт/)).toBeTruthy();
  });

  it('"Бүгд" filter сонгогдсон үед 15 template харагдана', () => {
    const { getAllByText } = render(<AdvisoryScreen />);
    // Category label "Нүүдэл / Отор" 4 template-д, гэхдээ filter pill-д 1 удаа гарна
    // Тест: бүх асуулт харагдах уу?
    // PRD 15 асуултын нэг ч гэсэн шалгана:
    expect(getAllByText('Хэзээ нүүх вэ?').length).toBeGreaterThan(0);
    expect(getAllByText('Зудын бэлтгэл яаж хийх вэ?').length).toBeGreaterThan(0);
    expect(getAllByText('Цагаан идээ яаж хийх вэ?').length).toBeGreaterThan(0);
  });

  it('category filter-ээр template шүүгдэнэ (зөвхөн Нүүдэл/Отор)', () => {
    const { getByText, queryByText, getAllByText } = render(<AdvisoryScreen />);
    // "Нүүдэл / Отор" нь filter pill + card meta хоёр газар гарна — эхнийх нь pill
    const pill = getAllByText('Нүүдэл / Отор')[0];
    fireEvent.press(pill);
    // Нүүдэл-ийн template үлдэнэ
    expect(getByText('Хэзээ нүүх вэ?')).toBeTruthy();
    // Бусад category template нуугдана
    expect(queryByText('Цагаан идээ яаж хийх вэ?')).toBeNull();
    expect(queryByText('Зудын бэлтгэл яаж хийх вэ?')).toBeNull();
  });

  it('template-ыг дармагц PRD schema-ийн 6 block харагдана', () => {
    const { getByText, queryByText } = render(<AdvisoryScreen />);

    // Нээгдээгүй үед block title байхгүй
    expect(queryByText('Одоо юу хийх')).toBeNull();

    // "Хэзээ нүүх вэ?" template-ыг нээнэ
    fireEvent.press(getByText('Хэзээ нүүх вэ?'));

    // 6 block title бүгд харагдана
    expect(getByText('Одоо юу хийх')).toBeTruthy();
    expect(getByText('Яагаад')).toBeTruthy();
    expect(getByText(/Алхмууд/)).toBeTruthy(); // "Алхмууд (6)" гэх мэт
    expect(getByText('Анхаарах')).toBeTruthy();
    expect(getByText('Эрсдэл')).toBeTruthy();
    expect(getByText('Хэнд мэдэгдэх')).toBeTruthy();
  });

  it('accordion дахин дарахад хаагдана', () => {
    const { getByText, queryByText } = render(<AdvisoryScreen />);

    // Нээх
    fireEvent.press(getByText('Хэзээ нүүх вэ?'));
    expect(getByText('Одоо юу хийх')).toBeTruthy();

    // Хаах
    fireEvent.press(getByText('Хэзээ нүүх вэ?'));
    expect(queryByText('Одоо юу хийх')).toBeNull();
  });
});
