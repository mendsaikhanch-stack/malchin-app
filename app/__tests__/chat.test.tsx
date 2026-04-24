import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Chat from '../chat';

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

describe('Chat — channel list', () => {
  it('header "Чат" + subtitle харагдана', () => {
    const { getByText } = render(<Chat />);
    expect(getByText('Чат')).toBeTruthy();
    expect(getByText(/Сум, баг, хоршоо/)).toBeTruthy();
  });

  it('5 mock channel бүгд харагдана', () => {
    const { getByText } = render(<Chat />);
    expect(getByText('Сумын мэдэгдэл')).toBeTruthy();
    expect(getByText('3-р багийн групп')).toBeTruthy();
    expect(getByText('Ноолуурын хоршоо')).toBeTruthy();
    expect(getByText('Мал эмч — Баатар')).toBeTruthy();
    expect(getByText('Багийн дарга — Дорж')).toBeTruthy();
  });

  it('unread badge нь зөвхөн unread > 0 channel-д', () => {
    const { getByText, queryAllByText } = render(<Chat />);
    // Сумын (2), Баг (5), Мал эмч (1) — 3 badge
    expect(getByText('2')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    // "0" badge байхгүй
    expect(queryAllByText('0').length).toBe(0);
  });

  it('Phase 2 hint харагдана', () => {
    const { getByText } = render(<Chat />);
    expect(getByText(/Phase 2-д бодитоор backend/)).toBeTruthy();
  });
});

describe('Chat — channel detail', () => {
  it('channel дарахад detail view нээгдэнэ', async () => {
    const { getByText, findByText } = render(<Chat />);
    fireEvent.press(getByText('3-р багийн групп'));
    // Header дотор channel нэр хэвээр гарна + subtitle "Багийн бүх гишүүн"
    expect(await findByText('Багийн бүх гишүүн')).toBeTruthy();
  });

  it('detail-д тухайн channel-ийн message-үүд харагдана', async () => {
    const { getByText, findByText } = render(<Chat />);
    fireEvent.press(getByText('3-р багийн групп'));
    expect(await findByText(/Өнөөдөр хурал байх/)).toBeTruthy();
    expect(await findByText('Очно оо.')).toBeTruthy();
    // Бусад channel-ийн message харагдахгүй
  });

  it('priority message "🔔 Яаралтай" tag-тай', async () => {
    const { getByText, findAllByText } = render(<Chat />);
    fireEvent.press(getByText('Сумын мэдэгдэл'));
    const tags = await findAllByText(/Яаралтай/);
    // 2 priority message байгаа → 2 tag
    expect(tags.length).toBe(2);
  });

  it('draft бичиж send дарахад message нэмэгдэнэ', async () => {
    const { getByText, getByPlaceholderText, findByText } = render(<Chat />);
    fireEvent.press(getByText('3-р багийн групп'));
    const input = await waitFor(() => getByPlaceholderText('Бичих...'));
    fireEvent.changeText(input, 'Тэгэхгүй ээ');
    // "➤" send button
    fireEvent.press(getByText('➤'));
    expect(await findByText('Тэгэхгүй ээ')).toBeTruthy();
  });

  it('хоосон draft-тай send дарсан үед message нэмэгдэхгүй', async () => {
    const { getByText, getByPlaceholderText, queryAllByText, findByText } = render(<Chat />);
    fireEvent.press(getByText('3-р багийн групп'));
    await findByText('Очно оо.');
    const initialMineCount = queryAllByText(/Очно оо\./).length;
    fireEvent.changeText(getByPlaceholderText('Бичих...'), '   ');
    fireEvent.press(getByText('➤'));
    // "Очно оо." 1 л байна хэвээр (шинэ mine bubble нэмэгдсэнгүй)
    expect(queryAllByText(/Очно оо\./).length).toBe(initialMineCount);
  });

  it('back button дарахад channel list-руу буцна', async () => {
    const { getByText, findByText, queryByText } = render(<Chat />);
    fireEvent.press(getByText('3-р багийн групп'));
    await findByText('Багийн бүх гишүүн');
    // Channel detail-ийн back button ‹
    fireEvent.press(getByText('‹'));
    // Channel list header subtitle дахин гарна
    await waitFor(() => {
      expect(queryByText('Багийн бүх гишүүн')).toBeNull();
    });
    expect(getByText(/Сум, баг, хоршоо/)).toBeTruthy();
  });
});
