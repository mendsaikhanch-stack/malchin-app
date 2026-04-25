import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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

// sync-queue + api-ийг mock хийнэ (submit/resolve queue-д орж байгааг шалгах)
const mockQueueOnFailure = jest.fn();
jest.mock('@/services/sync-queue', () => ({
  queueOnFailure: (...args: unknown[]) => mockQueueOnFailure(...args),
}));

jest.mock('@/services/api', () => ({
  lostFoundApi: {
    create: jest.fn(),
    resolve: jest.fn(),
    report: jest.fn(),
  },
}));

beforeEach(() => {
  mockQueueOnFailure.mockReset();
  mockQueueOnFailure.mockResolvedValue({ synced: true });
});

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

describe('LostFoundScreen — queue wire (offline-first regression)', () => {
  it('submit → queueOnFailure (table_name=lost_found, action=INSERT)', async () => {
    const { findByText, getByText, getAllByPlaceholderText } = render(<LostFoundScreen />);
    await findByText(/Хүрэн-Овоо/);

    fireEvent.press(getByText(/\+ Алдсан мал зарлах/));
    await waitFor(() => expect(getByText(/Сүүлд үзсэн газар/)).toBeTruthy());

    // Required field-үүдийг бөглөнө (validateListing pass-гэхийн тулд)
    const countInput = getAllByPlaceholderText(/Жишээ: 2/)[0];
    fireEvent.changeText(countInput, '2');
    const lastSeenInput = getAllByPlaceholderText(/Аймаг, сум, баг, тодорхой газар/)[0];
    fireEvent.changeText(lastSeenInput, 'Төв аймаг, Алтанбулаг сум, 3-р баг, Хүрэн-Овоо');
    const phoneInput = getAllByPlaceholderText('99112233')[0];
    fireEvent.changeText(phoneInput, '99001122');

    fireEvent.press(getByText('Илгээх'));

    await waitFor(() => expect(mockQueueOnFailure).toHaveBeenCalledTimes(1));
    const [, fallback] = mockQueueOnFailure.mock.calls[0];
    expect(fallback.table_name).toBe('lost_found');
    expect(fallback.action).toBe('INSERT');
    expect(fallback.data.phone).toBe('99001122');
    // Payload-д id/status дамжуулахгүй (server assign)
    expect(fallback.data.id).toBeUndefined();
    expect(fallback.data.status).toBeUndefined();
  });

  it('markResolved → queueOnFailure (action=UPDATE, resolved status)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      // "Тийм" товчийг автоматаар дарна (confirmation dialog)
      const yes = buttons?.find((b) => b.text === 'Тийм');
      yes?.onPress?.();
    });

    const { findByText, getByText } = render(<LostFoundScreen />);
    const card = await findByText(/Хүрэн-Овоо/);
    fireEvent.press(card);

    await waitFor(() => expect(getByText('Эзэнд хүрсэн')).toBeTruthy());
    fireEvent.press(getByText('Эзэнд хүрсэн'));

    await waitFor(() => expect(mockQueueOnFailure).toHaveBeenCalledTimes(1));
    const [, fallback] = mockQueueOnFailure.mock.calls[0];
    expect(fallback.table_name).toBe('lost_found');
    expect(fallback.action).toBe('UPDATE');
    expect(fallback.data.status).toBe('resolved');

    alertSpy.mockRestore();
  });

  it('queueOnFailure synced=false үед "Локал хадгалагдлаа" alert гарна', async () => {
    mockQueueOnFailure.mockResolvedValue({ synced: false });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText, getByText, getAllByPlaceholderText } = render(<LostFoundScreen />);
    await findByText(/Хүрэн-Овоо/);

    fireEvent.press(getByText(/\+ Алдсан мал зарлах/));
    await waitFor(() => expect(getByText(/Сүүлд үзсэн газар/)).toBeTruthy());

    fireEvent.changeText(getAllByPlaceholderText(/Жишээ: 2/)[0], '1');
    fireEvent.changeText(getAllByPlaceholderText(/Аймаг, сум, баг, тодорхой газар/)[0], 'Төв');
    fireEvent.changeText(getAllByPlaceholderText('99112233')[0], '99001122');
    fireEvent.press(getByText('Илгээх'));

    await waitFor(() => {
      const msgs = alertSpy.mock.calls.map((c) => c[0]);
      expect(msgs).toContain('Локал хадгалагдлаа');
    });
    alertSpy.mockRestore();
  });
});
