import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import KnowledgeScreen from '../(tabs)/knowledge';

const mockGetAll = jest.fn();
const mockGetDailyTip = jest.fn();
const mockSearch = jest.fn();

jest.mock('@/services/api', () => ({
  knowledgeApi: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getDailyTip: (...args: any[]) => mockGetDailyTip(...args),
    search: (...args: any[]) => mockSearch(...args),
  },
}));

const mockItems = [
  {
    id: 1,
    title: 'Хонины тураал',
    content: 'Хаварт тураалаас сэргийлэх арга...',
    category: 'care',
    animal_type: 'sheep',
    season: 'spring',
  },
  {
    id: 2,
    title: 'Ямааны ноолуур самналт',
    content: 'Ноолуур самналтын зөв цаг...',
    category: 'seasonal',
    animal_type: 'goat',
    season: 'spring',
  },
  {
    id: 3,
    title: 'Адууны үржил',
    content: 'Азарга унага хуваах...',
    category: 'breeding',
    animal_type: 'horse',
  },
];

const mockTip = {
  title: 'Өдрийн зөвлөмж',
  content: 'Өглөө эрт малаа усалж бай.',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(mockItems);
  mockGetDailyTip.mockResolvedValue({ tip: mockTip });
  mockSearch.mockResolvedValue([mockItems[0]]);
});

describe('Knowledge — header + filter', () => {
  it('header render', async () => {
    const { getByText } = render(<KnowledgeScreen />);
    expect(getByText(/Мал маллах ухаан/)).toBeTruthy();
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
  });

  it('категорийн 5 chip render (Бүгд/Мал эмнэлэг/Үржил/Улирлын ажил/Ардын ухаан)', () => {
    const { getByText } = render(<KnowledgeScreen />);
    expect(getByText(/Мал эмнэлэг/)).toBeTruthy();
    expect(getByText(/Үржил/)).toBeTruthy();
    expect(getByText(/Улирлын ажил/)).toBeTruthy();
    expect(getByText(/Ардын ухаан/)).toBeTruthy();
  });

  it('малын төрлийн 6 chip render', () => {
    const { getByText } = render(<KnowledgeScreen />);
    expect(getByText(/Хонь/)).toBeTruthy();
    expect(getByText(/Ямаа/)).toBeTruthy();
    expect(getByText(/Үхэр/)).toBeTruthy();
    expect(getByText(/Адуу/)).toBeTruthy();
    expect(getByText(/Тэмээ/)).toBeTruthy();
  });
});

describe('Knowledge — өгөгдөл ачаалах', () => {
  it('mount үед knowledgeApi.getAll() + getDailyTip() дуудна', async () => {
    render(<KnowledgeScreen />);
    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalled();
      expect(mockGetDailyTip).toHaveBeenCalled();
    });
  });

  it('mock item-ууд render хийгдэнэ', async () => {
    const { findByText } = render(<KnowledgeScreen />);
    expect(await findByText('Хонины тураал')).toBeTruthy();
    expect(await findByText('Ямааны ноолуур самналт')).toBeTruthy();
    expect(await findByText('Адууны үржил')).toBeTruthy();
  });

  it('result count "N мэдлэг олдлоо" render', async () => {
    const { findByText } = render(<KnowledgeScreen />);
    expect(await findByText(/3 мэдлэг олдлоо/)).toBeTruthy();
  });

  it('daily tip card render (search/category хоосон үед)', async () => {
    const { findByText } = render(<KnowledgeScreen />);
    expect(await findByText(/Өдрийн мэдлэг/)).toBeTruthy();
    expect(await findByText('Өдрийн зөвлөмж')).toBeTruthy();
    expect(await findByText(/Өглөө эрт малаа усалж/)).toBeTruthy();
  });
});

describe('Knowledge — категори filter', () => {
  it('"Мал эмнэлэг" chip дарахад getAll("care") дуудна', async () => {
    const { getByText } = render(<KnowledgeScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    fireEvent.press(getByText(/Мал эмнэлэг/));
    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledWith('care', undefined);
    });
  });

  it('"Үржил" chip дарахад getAll("breeding") дуудна', async () => {
    const { getByText } = render(<KnowledgeScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    fireEvent.press(getByText(/Үржил/));
    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledWith('breeding', undefined);
    });
  });
});

describe('Knowledge — малын filter', () => {
  it('"Хонь" chip дарахад getAll(undefined, "sheep") дуудна', async () => {
    const { getAllByText } = render(<KnowledgeScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    // "🐑 Хонь" нь filter chip ба item tag-д давхардана. Эхнийх нь chip.
    const chips = getAllByText('🐑 Хонь');
    fireEvent.press(chips[0]);
    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledWith(undefined, 'sheep');
    });
  });
});

describe('Knowledge — хайлт', () => {
  it('search input-д бичихэд search() дуудна', async () => {
    const { getByPlaceholderText } = render(<KnowledgeScreen />);
    const input = getByPlaceholderText(/Хайх/);
    fireEvent.changeText(input, 'тураал');
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('тураал');
    });
  });

  it('хайлт хоосон үед getAll дуудна (search trim)', async () => {
    const { getByPlaceholderText } = render(<KnowledgeScreen />);
    const input = getByPlaceholderText(/Хайх/);
    fireEvent.changeText(input, '   ');
    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalled();
    });
    expect(mockSearch).not.toHaveBeenCalled();
  });
});

describe('Knowledge — expand/collapse item', () => {
  it('item дарахад content expand', async () => {
    const { findByText, queryByText } = render(<KnowledgeScreen />);
    const item = await findByText('Хонины тураал');
    expect(queryByText(/Хаварт тураалаас сэргийлэх/)).toBeNull();
    fireEvent.press(item);
    expect(await findByText(/Хаварт тураалаас сэргийлэх/)).toBeTruthy();
  });

  it('дахин дарахад collapse', async () => {
    const { findByText, queryByText } = render(<KnowledgeScreen />);
    const item = await findByText('Хонины тураал');
    fireEvent.press(item);
    await findByText(/Хаварт тураалаас сэргийлэх/);
    fireEvent.press(item);
    await waitFor(() => {
      expect(queryByText(/Хаварт тураалаас сэргийлэх/)).toBeNull();
    });
  });
});

describe('Knowledge — empty state', () => {
  it('item жагсаалт хоосон үед "Мэдлэг олдсонгүй" render', async () => {
    mockGetAll.mockResolvedValueOnce([]);
    const { findByText } = render(<KnowledgeScreen />);
    expect(await findByText('Мэдлэг олдсонгүй')).toBeTruthy();
  });
});
