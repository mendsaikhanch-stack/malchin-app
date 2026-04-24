import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VetBooking from '../vet-booking';

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

describe('VetBooking — жагсаалт', () => {
  it('header render', () => {
    const { getByText } = render(<VetBooking />);
    expect(getByText('Мал эмч захиалах')).toBeTruthy();
    expect(getByText(/ойролцоох эмчүүд/)).toBeTruthy();
  });

  it('байршил + радиус мэдээлэл render', () => {
    const { getByText } = render(<VetBooking />);
    expect(getByText(/Төв аймаг, Алтанбулаг сум.*100 км/)).toBeTruthy();
  });

  it('4 mock эмч бүгд жагсаалтанд', () => {
    const { getByText } = render(<VetBooking />);
    expect(getByText('Баатар.Д')).toBeTruthy();
    expect(getByText('Цэцэгмаа.Б')).toBeTruthy();
    expect(getByText('Ганбаатар.Н')).toBeTruthy();
    expect(getByText('Оюунбилэг.Т')).toBeTruthy();
  });

  it('available=false эмч "Завгүй" badge-тэй', () => {
    const { getByText } = render(<VetBooking />);
    // Ганбаатар.Н (id 3) нь завгүй
    expect(getByText('Завгүй')).toBeTruthy();
  });

  it('verified эмч "✓" tag-тэй', () => {
    const { getAllByText } = render(<VetBooking />);
    // 3 verified (Баатар, Цэцэгмаа, Ганбаатар), Оюунбилэг verified=false
    const tags = getAllByText('✓');
    expect(tags.length).toBe(3);
  });

  it('эмч бүрийн тусгай чиглэл chip render', () => {
    const { getByText } = render(<VetBooking />);
    expect(getByText('Бог мал')).toBeTruthy();
    expect(getByText('Мэс засал')).toBeTruthy();
    expect(getByText('Адуу')).toBeTruthy();
  });
});

describe('VetBooking — захиалгын modal', () => {
  it('"Захиалах" дарахад modal нээгдэнэ (vet нэр гарчигт)', async () => {
    const { getAllByText, findByText } = render(<VetBooking />);
    // Available 3 эмч дээр "Захиалах" button байна
    const bookBtns = getAllByText(/Захиалах/);
    fireEvent.press(bookBtns[0]); // Баатар.Д
    expect(await findByText(/Баатар.Д-д захиалга/)).toBeTruthy();
  });

  it('үйлчилгээний chip render хийгдэнэ modal дотор', async () => {
    const { getAllByText, findByText } = render(<VetBooking />);
    const bookBtns = getAllByText(/Захиалах/);
    fireEvent.press(bookBtns[0]);
    await findByText(/Баатар.Д-д захиалга/);
    expect(await findByText(/Вакцинжуулалт/)).toBeTruthy();
    expect(await findByText(/Ерөнхий үзлэг/)).toBeTruthy();
    expect(await findByText(/Төллөлтийн туслалцаа/)).toBeTruthy();
  });

  it('form хоосон submit ("Илгээх") → modal нээлттэй хэвээр', async () => {
    const { getAllByText, findByText, getByText } = render(<VetBooking />);
    fireEvent.press(getAllByText(/Захиалах/)[0]);
    await findByText(/Баатар.Д-д захиалга/);
    // Modal-ын submit button "Илгээх"
    fireEvent.press(getByText('Илгээх'));
    // Alert дуудагдсан ч modal унтраагүй
    expect(getByText(/Баатар.Д-д захиалга/)).toBeTruthy();
  });

  it('Цуцлах дарахад modal хаагдана', async () => {
    const { getAllByText, findByText, queryByText, getByText } = render(<VetBooking />);
    fireEvent.press(getAllByText(/Захиалах/)[0]);
    await findByText(/Баатар.Д-д захиалга/);
    fireEvent.press(getByText('Цуцлах'));
    await waitFor(() => expect(queryByText(/Баатар.Д-д захиалга/)).toBeNull());
  });
});
