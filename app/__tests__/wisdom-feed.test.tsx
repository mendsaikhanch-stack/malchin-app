import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WisdomFeed from '../wisdom-feed';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

describe('WisdomFeed — жагсаалт', () => {
  it('header render', () => {
    const { getByText } = render(<WisdomFeed />);
    expect(getByText('Малчны ухаан')).toBeTruthy();
    expect(getByText(/Ахмад, мэргэжилтний зөвлөгөө/)).toBeTruthy();
  });

  it('default (Бүгд) — 5 content item бүгд харагдана', () => {
    const { getByText } = render(<WisdomFeed />);
    expect(getByText('Хаврын цасны хайлгалтыг шинжих')).toBeTruthy();
    expect(getByText('Ямаа угаах цаг, арга')).toBeTruthy();
    expect(getByText('Сул малыг тордох мэргэжлийн зөвлөгөө')).toBeTruthy();
    expect(getByText(/Вакцинжуулалтын 2026 оны/)).toBeTruthy();
    expect(getByText('Төл бойжилт — үүрэн хайр')).toBeTruthy();
  });

  it('"Ахмадын ухаан" filter нь 3 elder content л харуулна', () => {
    const { getByText, queryByText, getAllByText } = render(<WisdomFeed />);
    // filter chip-тэй ижил нэртэй src badge card дээр давхцана — эхнийх нь chip
    const chips = getAllByText(/Ахмадын ухаан/);
    fireEvent.press(chips[0]);
    // Elder: id 1, 2, 5
    expect(getByText('Хаврын цасны хайлгалтыг шинжих')).toBeTruthy();
    expect(getByText('Ямаа угаах цаг, арга')).toBeTruthy();
    expect(getByText('Төл бойжилт — үүрэн хайр')).toBeTruthy();
    // Expert + official нуугдана
    expect(queryByText(/Сул малыг тордох мэргэжлийн/)).toBeNull();
    expect(queryByText(/Вакцинжуулалтын 2026/)).toBeNull();
  });

  it('"Мэргэжилтэн" filter нь expert content харуулна', () => {
    const { getByText, queryByText, getAllByText } = render(<WisdomFeed />);
    const chips = getAllByText(/Мэргэжилтэн/);
    fireEvent.press(chips[0]);
    expect(getByText(/Сул малыг тордох мэргэжлийн/)).toBeTruthy();
    expect(queryByText('Хаврын цасны хайлгалтыг шинжих')).toBeNull();
  });

  it('"Албан ёсны" filter — official content харуулна', () => {
    const { getByText, queryByText, getAllByText } = render(<WisdomFeed />);
    const chips = getAllByText(/Албан ёсны/);
    fireEvent.press(chips[0]);
    expect(getByText(/Вакцинжуулалтын 2026 оны/)).toBeTruthy();
    expect(queryByText('Хаврын цасны хайлгалтыг шинжих')).toBeNull();
  });
});

describe('WisdomFeed — detail modal', () => {
  it('item дарахад detail modal нээгдэнэ', async () => {
    const { getByText, findByText } = render(<WisdomFeed />);
    fireEvent.press(getByText('Хаврын цасны хайлгалтыг шинжих'));
    // Detail modal-д location харагдана
    expect(await findByText(/Алтанбулаг/)).toBeTruthy();
  });

  it('elder source detail-д "уламжлалт ажиглалт" note харуулна', async () => {
    const { getByText, findByText } = render(<WisdomFeed />);
    fireEvent.press(getByText('Ямаа угаах цаг, арга'));
    expect(await findByText(/уламжлалт ажиглалт ба туршлага/)).toBeTruthy();
  });

  it('audio item detail-д audio player placeholder', async () => {
    const { getByText, findByText } = render(<WisdomFeed />);
    fireEvent.press(getByText('Ямаа угаах цаг, арга'));
    expect(await findByText(/Audio player \(Phase 2\)/)).toBeTruthy();
  });

  it('close ✕ button дарахад modal хаагдана', async () => {
    const { getByText, findByText, queryByText } = render(<WisdomFeed />);
    fireEvent.press(getByText('Хаврын цасны хайлгалтыг шинжих'));
    await findByText(/Алтанбулаг/);
    fireEvent.press(getByText('✕'));
    await waitFor(() => {
      expect(queryByText(/Алтанбулаг/)).toBeNull();
    });
  });

  it('detail-д "Хадгалах" дарахад "🔖 Хадгалсан"-руу шилжинэ', async () => {
    const { getByText, findByText } = render(<WisdomFeed />);
    fireEvent.press(getByText('Хаврын цасны хайлгалтыг шинжих'));
    const saveBtn = await findByText(/📑 Хадгалах/);
    fireEvent.press(saveBtn);
    expect(await findByText(/🔖 Хадгалсан/)).toBeTruthy();
  });
});
