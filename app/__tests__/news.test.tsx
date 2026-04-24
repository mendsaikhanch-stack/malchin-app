import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NewsScreen from '../(tabs)/news';

const mockGetAll = jest.fn();
const mockGetPrograms = jest.fn();
const mockGetIntlPrices = jest.fn();

jest.mock('@/services/api', () => ({
  newsApi: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getPrograms: (...args: any[]) => mockGetPrograms(...args),
    getIntlPrices: (...args: any[]) => mockGetIntlPrices(...args),
  },
  adsApi: { get: jest.fn(() => Promise.resolve([])), click: jest.fn() },
}));

jest.mock('@/components/ad-banner', () => ({ AdBanner: () => null }));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

const mockNews = [
  {
    id: 1,
    title: 'Малын түүхий эдийн үнэ өсөв',
    summary: 'Ноолуурын экспортын үнэ 8% өссөн.',
    category: 'intl_market',
    source: 'news.mn',
    region: 'Улаанбаатар',
    published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace('Z', ''),
    is_urgent: false,
  },
  {
    id: 2,
    title: 'Шинэ хууль батлагдлаа',
    summary: 'Малчдын НДШ-ийн хөнгөлөлт.',
    category: 'government',
    source: 'parliament.mn',
    region: '',
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString().replace('Z', ''),
    is_urgent: true,
  },
];

const mockPrograms = [
  {
    id: 10,
    title: 'Малчны нэмэлт зээл',
    description: 'Жилийн 8% хүүтэй',
    category: 'loan',
    organization: 'Хаан банк',
    eligibility: 'Малчин иргэн',
    amount: '5-50сая',
    deadline: '2026-12-31',
    contact: '99112233',
  },
  {
    id: 11,
    title: 'Даатгалын урамшуулал',
    description: 'Малын даатгалын хөнгөлөлт',
    category: 'insurance',
    organization: 'ХХААХҮЯ',
    eligibility: 'Бүгд',
    amount: '',
    deadline: '',
    contact: 'info@mofa.gov.mn',
  },
];

const mockIntlPrices = [
  { commodity_mn: 'Ноолуур', unit: 'USD/кг', price_usd: 110, prev_price_usd: 100, market: 'London' },
  { commodity_mn: 'Ноос', unit: 'USD/кг', price_usd: 4.5, prev_price_usd: 5.0, market: 'Sydney' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(mockNews);
  mockGetPrograms.mockResolvedValue(mockPrograms);
  mockGetIntlPrices.mockResolvedValue(mockIntlPrices);
});

describe('News — header + tabs', () => {
  it('header render', () => {
    const { getByText } = render(<NewsScreen />);
    expect(getByText(/Мэдээ & Боломж/)).toBeTruthy();
  });

  it('3 tab render: Мэдээ, Боломж, Гадаад ханш', () => {
    const { getByText } = render(<NewsScreen />);
    expect(getByText('Мэдээ')).toBeTruthy();
    expect(getByText('Боломж')).toBeTruthy();
    expect(getByText('Гадаад ханш')).toBeTruthy();
  });

  it('default — Мэдээ tab (getAll дуудна)', async () => {
    render(<NewsScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetPrograms).not.toHaveBeenCalled();
    expect(mockGetIntlPrices).not.toHaveBeenCalled();
  });
});

describe('News — Мэдээ tab', () => {
  it('мэдээний card-ууд render', async () => {
    const { findByText } = render(<NewsScreen />);
    expect(await findByText('Малын түүхий эдийн үнэ өсөв')).toBeTruthy();
    expect(await findByText('Шинэ хууль батлагдлаа')).toBeTruthy();
  });

  it('is_urgent=true дээр "Яаралтай" badge', async () => {
    const { findByText } = render(<NewsScreen />);
    expect(await findByText(/Яаралтай/)).toBeTruthy();
  });

  it('category badge label render (Гадаад зах зээл / Засгийн газар)', async () => {
    const { findAllByText } = render(<NewsScreen />);
    // filter chip + card badge давхардана — 2+ байх ёстой
    const intlMatches = await findAllByText(/Гадаад зах зээл/);
    expect(intlMatches.length).toBeGreaterThanOrEqual(2);
    const govMatches = await findAllByText(/Засгийн газар/);
    expect(govMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('source + region footer render', async () => {
    const { findByText } = render(<NewsScreen />);
    expect(await findByText('news.mn')).toBeTruthy();
    expect(await findByText(/Улаанбаатар/)).toBeTruthy();
  });

  it('"Засгийн газар" chip дарахад getAll("government") дуудна', async () => {
    const { getAllByText } = render(<NewsScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    // Chip + card badge давхардсан тул эхнийхийг chip гэж үзнэ
    const items = getAllByText(/Засгийн газар/);
    fireEvent.press(items[0]);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith('government'));
  });

  it('мэдээ хоосон үед "Мэдээ олдсонгүй"', async () => {
    mockGetAll.mockResolvedValueOnce([]);
    const { findByText } = render(<NewsScreen />);
    expect(await findByText('Мэдээ олдсонгүй')).toBeTruthy();
  });
});

describe('News — Боломж tab', () => {
  it('"Боломж" дарахад getPrograms() дуудна', async () => {
    const { getByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    await waitFor(() => expect(mockGetPrograms).toHaveBeenCalled());
  });

  it('program card-ууд render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    expect(await findByText('Малчны нэмэлт зээл')).toBeTruthy();
    expect(await findByText('Даатгалын урамшуулал')).toBeTruthy();
  });

  it('amount badge + deadline render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    expect(await findByText('5-50сая')).toBeTruthy();
    expect(await findByText(/2026-12-31/)).toBeTruthy();
  });

  it('organization + eligibility render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    expect(await findByText('Хаан банк')).toBeTruthy();
    expect(await findByText('Малчин иргэн')).toBeTruthy();
  });

  it('contact button (утас/имэйл) render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    expect(await findByText(/99112233/)).toBeTruthy();
    expect(await findByText(/info@mofa.gov.mn/)).toBeTruthy();
  });

  it('хоосон хөтөлбөр үед "Хөтөлбөр олдсонгүй"', async () => {
    mockGetPrograms.mockResolvedValueOnce([]);
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Боломж'));
    expect(await findByText('Хөтөлбөр олдсонгүй')).toBeTruthy();
  });
});

describe('News — Гадаад ханш tab', () => {
  it('"Гадаад ханш" дарахад getIntlPrices() дуудна', async () => {
    const { getByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Гадаад ханш'));
    await waitFor(() => expect(mockGetIntlPrices).toHaveBeenCalled());
  });

  it('commodity + price render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Гадаад ханш'));
    expect(await findByText('Ноолуур')).toBeTruthy();
    expect(await findByText('Ноос')).toBeTruthy();
    expect(await findByText('$110')).toBeTruthy();
    expect(await findByText('$4.5')).toBeTruthy();
  });

  it('% өөрчлөлт render (өсөлт/бууралт)', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Гадаад ханш'));
    // Ноолуур 100 → 110: +10.0%
    expect(await findByText('+10.0%')).toBeTruthy();
    // Ноос 5.0 → 4.5: -10.0%
    expect(await findByText('-10.0%')).toBeTruthy();
  });

  it('"international" note card render', async () => {
    const { getByText, findByText } = render(<NewsScreen />);
    fireEvent.press(getByText('Гадаад ханш'));
    expect(await findByText(/олон улсын биржийн/)).toBeTruthy();
  });
});
