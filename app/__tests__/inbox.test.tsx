import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Inbox from '../inbox';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

describe('Inbox — жагсаалт', () => {
  it('header + unread count render', () => {
    const { getByText } = render(<Inbox />);
    expect(getByText('Мэдэгдэл')).toBeTruthy();
    // 3 unread (id 1,2,5) + 2 баталгаажуулаагүй (id 1,2)
    expect(getByText(/3 уншаагүй/)).toBeTruthy();
    expect(getByText(/2 баталгаажуулаагүй/)).toBeTruthy();
  });

  it('default (Бүгд) filter — 6 notification бүгд харагдана', () => {
    const { getByText } = render(<Inbox />);
    expect(getByText('Зудын өндөр эрсдэл')).toBeTruthy();
    expect(getByText('Мал тооллого — 3-р баг')).toBeTruthy();
    expect(getByText('Багийн хурал')).toBeTruthy();
    expect(getByText('Вакцинжуулалт — ирэх 7 хоногт')).toBeTruthy();
    expect(getByText('Ноолуурын үнэ өссөн')).toBeTruthy();
    expect(getByText('Бүртгэл амжилттай')).toBeTruthy();
  });

  it('"Уншаагүй" filter нь зөвхөн unread item харуулна', () => {
    const { getByText, queryByText } = render(<Inbox />);
    fireEvent.press(getByText(/Уншаагүй \(3\)/));
    expect(getByText('Зудын өндөр эрсдэл')).toBeTruthy(); // unread
    expect(getByText('Мал тооллого — 3-р баг')).toBeTruthy(); // unread
    expect(queryByText('Багийн хурал')).toBeNull(); // read=true
    expect(queryByText('Бүртгэл амжилттай')).toBeNull(); // read=true
  });

  it('category filter "Сум" — sum category only', () => {
    const { getByText, queryByText } = render(<Inbox />);
    // "🏛️ Сум" нь unique chip label (body text-үүд "Сумын..." гэж эхэлдэг)
    fireEvent.press(getByText(/🏛️ Сум/));
    expect(getByText('Мал тооллого — 3-р баг')).toBeTruthy();
    expect(queryByText('Зудын өндөр эрсдэл')).toBeNull(); // alert
    expect(queryByText('Багийн хурал')).toBeNull(); // bag
  });

  it('баталгаажуулалт шаардлагатай item "⚠ Баталгаажуулалт" banner-тай', () => {
    const { getAllByText } = render(<Inbox />);
    const banners = getAllByText(/Баталгаажуулалт шаардана/);
    // 2 item (id 1, 2)
    expect(banners.length).toBe(2);
  });

  it('"Бүгдийг уншсан" дарахад subtitle "Бүгд уншсан"-д хөрвөнө', async () => {
    const { getByText, queryByText } = render(<Inbox />);
    fireEvent.press(getByText('Бүгдийг уншсан'));
    await waitFor(() => {
      expect(getByText(/Бүгд уншсан/)).toBeTruthy();
      expect(queryByText(/3 уншаагүй/)).toBeNull();
    });
  });
});

describe('Inbox — detail modal', () => {
  it('item дарахад detail modal нээгдэнэ', async () => {
    const { getByText, getAllByText } = render(<Inbox />);
    fireEvent.press(getByText('Багийн хурал'));
    await waitFor(() => {
      // Detail modal-д from + date meta харагдана
      expect(getAllByText(/Дорж.Т \(баг дарга\)/).length).toBeGreaterThan(0);
    });
  });

  it('require-ack notification detail-д "Уншсан, ойлголоо" button бий', async () => {
    const { getByText, findByText } = render(<Inbox />);
    fireEvent.press(getByText('Зудын өндөр эрсдэл'));
    expect(await findByText(/Уншсан, ойлголоо/)).toBeTruthy();
  });

  it('ack button дарахад "Баталгаажуулсан" харуулна', async () => {
    const { getByText, findByText, findAllByText } = render(<Inbox />);
    fireEvent.press(getByText('Зудын өндөр эрсдэл'));
    await findByText(/Уншсан, ойлголоо/);
    fireEvent.press(getByText(/Уншсан, ойлголоо/));
    const acks = await findAllByText(/Баталгаажуулсан/);
    expect(acks.length).toBeGreaterThan(0);
  });

  it('close button дарахад modal хаагдана', async () => {
    const { getByText, findByText, queryByText } = render(<Inbox />);
    fireEvent.press(getByText('Багийн хурал'));
    await findByText('📅 2026-04-22 09:15');
    fireEvent.press(getByText('✕'));
    await waitFor(() => {
      expect(queryByText('📅 2026-04-22 09:15')).toBeNull();
    });
  });
});
