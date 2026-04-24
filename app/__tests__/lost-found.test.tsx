import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LostFoundScreen from '../lost-found';

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

// ReportButton дотор ашигладаг reportApi-г mock хийх шаардлагагүй
// (UI-ийн хувьд render хийгдэх л чухал)

describe('LostFoundScreen', () => {
  it('header "Алдсан / Олдсон мал"', () => {
    const { getByText } = render(<LostFoundScreen />);
    expect(getByText('Алдсан / Олдсон мал')).toBeTruthy();
  });

  it('default "lost" tab-д алдсан мал харагдана (mock)', async () => {
    const { findByText } = render(<LostFoundScreen />);
    // getMockListings-д 2 lost (horse + sheep) + 1 found (cow)
    // Дефолт tab = lost
    expect(await findByText(/Алтанбулаг.*3-р баг, Хүрэн-Овоо/)).toBeTruthy();
  });

  it('tab-ыг "found" руу шилжүүлэхэд cow listing харагдана', async () => {
    const { findByText, getByText } = render(<LostFoundScreen />);
    // Эхний render-д алдсан tab default
    await findByText(/Хүрэн-Овоо/);

    // Found tab товч — текст доторх prefix "✅ Олдсон"
    const foundTab = getByText(/Олдсон \(\d+\)/);
    fireEvent.press(foundTab);

    // Found-ын mock listing байршил
    await findByText(/Заамар/);
  });

  it('FAB товч (Алдсан мал зарлах) даавал form modal нээгдэнэ', async () => {
    const { findByText, getByText } = render(<LostFoundScreen />);
    await findByText(/Хүрэн-Овоо/); // wait load

    // FAB товч
    fireEvent.press(getByText(/\+ Алдсан мал зарлах/));

    // Modal гарчиг (validation label "Сүүлд үзсэн газар *")
    await waitFor(() =>
      expect(getByText(/Сүүлд үзсэн газар/)).toBeTruthy()
    );
  });

  it('listing card-ыг даавал detail modal нээгдэнэ', async () => {
    const { findByText, getByText } = render(<LostFoundScreen />);
    const card = await findByText(/Хүрэн-Овоо/);
    fireEvent.press(card);

    // Detail modal-д утас label
    await waitFor(() => expect(getByText('Утас')).toBeTruthy());
  });
});
