import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WeatherScreen from '../(tabs)/weather';

const mockGetByAimag = jest.fn();

jest.mock('@/services/api', () => ({
  weatherApi: {
    getByAimag: (...args: any[]) => mockGetByAimag(...args),
  },
}));

const highRiskPayload = {
  temp: -25,
  feels_like: -32,
  condition: 'snow',
  wind: 12,
  humidity: 60,
  temp_min: -30,
  temp_max: -18,
  dzud_risk: 'high',
  forecast: [
    { date: '2026-04-25', condition: 'snow', temp_max: -18, temp_min: -28, wind: 10, dzud_risk: 'high' },
    { date: '2026-04-26', condition: 'cloudy', temp_max: -12, temp_min: -22, wind: 6, dzud_risk: 'medium' },
    { date: '2026-04-27', condition: 'clear', temp_max: -5, temp_min: -15, wind: 4, dzud_risk: 'low' },
  ],
};

const lowRiskPayload = {
  temp: 18,
  feels_like: 16,
  condition: 'sunny',
  wind: 3,
  humidity: 40,
  temp_min: 10,
  temp_max: 22,
  dzud_risk: 'low',
  forecast: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetByAimag.mockResolvedValue(highRiskPayload);
});

describe('Weather — initial load', () => {
  it('mount үед getByAimag("Төв") дуудна (default аймаг)', async () => {
    render(<WeatherScreen />);
    await waitFor(() => expect(mockGetByAimag).toHaveBeenCalledWith('Төв'));
  });

  it('header render (ачаалсны дараа)', async () => {
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText(/Цаг агаар/)).toBeTruthy();
  });

  it('13 аймгийн chip render', async () => {
    const { findByText, getByText } = render(<WeatherScreen />);
    await findByText(/Цаг агаар/);
    expect(getByText('Төв')).toBeTruthy();
    expect(getByText('Увс')).toBeTruthy();
    expect(getByText('Ховд')).toBeTruthy();
    expect(getByText('Баян-Өлгий')).toBeTruthy();
    expect(getByText('Өмнөговь')).toBeTruthy();
    expect(getByText('Булган')).toBeTruthy();
  });
});

describe('Weather — current card', () => {
  it('temp/condition render (snow → "Цастай")', async () => {
    const { findByText, findAllByText } = render(<WeatherScreen />);
    expect(await findByText('-25°C')).toBeTruthy();
    // Current card + forecast item-уудад давхардана
    const snowy = await findAllByText('Цастай');
    expect(snowy.length).toBeGreaterThan(0);
  });

  it('feels_like render', async () => {
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText(/Мэдрэгдэх: -32°C/)).toBeTruthy();
  });

  it('салхи, чийгшил, temp_min, temp_max render', async () => {
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText('12 м/с')).toBeTruthy();
    expect(await findByText('60%')).toBeTruthy();
    expect(await findByText('-30°C')).toBeTruthy();
    expect(await findByText('-18°C')).toBeTruthy();
  });

  it('condition "sunny" → "Цэлмэг"', async () => {
    mockGetByAimag.mockResolvedValueOnce(lowRiskPayload);
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText('Цэлмэг')).toBeTruthy();
  });
});

describe('Weather — зудын эрсдэл', () => {
  it('high risk — "Өндөр эрсдэлтэй" + warning message render', async () => {
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText(/Зудын эрсдэл/)).toBeTruthy();
    expect(await findByText('Өндөр эрсдэлтэй')).toBeTruthy();
    expect(await findByText(/Малаа дулаан хашаанд/)).toBeTruthy();
  });

  it('low risk — "Бага эрсдэлтэй", warning message байхгүй', async () => {
    mockGetByAimag.mockResolvedValueOnce(lowRiskPayload);
    const { findByText, queryByText } = render(<WeatherScreen />);
    expect(await findByText('Бага эрсдэлтэй')).toBeTruthy();
    expect(queryByText(/Малаа дулаан хашаанд/)).toBeNull();
  });
});

describe('Weather — 5 өдрийн forecast', () => {
  it('forecast section render (3 item mock-д)', async () => {
    const { findByText, getByText } = render(<WeatherScreen />);
    expect(await findByText('5 өдрийн урьдчилсан мэдээ')).toBeTruthy();
    expect(getByText('2026-04-25')).toBeTruthy();
    expect(getByText('2026-04-26')).toBeTruthy();
    expect(getByText('2026-04-27')).toBeTruthy();
  });

  it('forecast хоосон үед section render хийгдэхгүй', async () => {
    mockGetByAimag.mockResolvedValueOnce(lowRiskPayload);
    const { findByText, queryByText } = render(<WeatherScreen />);
    await findByText('Бага эрсдэлтэй');
    expect(queryByText('5 өдрийн урьдчилсан мэдээ')).toBeNull();
  });
});

describe('Weather — аймаг солих', () => {
  it('"Увс" chip дарахад getByAimag("Увс") дуудна', async () => {
    const { findByText, getByText } = render(<WeatherScreen />);
    await findByText(/Цаг агаар/);
    fireEvent.press(getByText('Увс'));
    await waitFor(() => expect(mockGetByAimag).toHaveBeenCalledWith('Увс'));
  });
});

describe('Weather — алдааны төлөв', () => {
  it('api reject үед "Цаг агаарын мэдээ ачааллаж чадсангүй" render', async () => {
    mockGetByAimag.mockRejectedValueOnce(new Error('network fail'));
    const { findByText } = render(<WeatherScreen />);
    expect(await findByText(/Цаг агаарын мэдээ ачааллаж чадсангүй/)).toBeTruthy();
    expect(await findByText('Дахин оролдох')).toBeTruthy();
  });

  it('"Дахин оролдох" дарахад getByAimag дахин дуудагдана', async () => {
    mockGetByAimag.mockRejectedValueOnce(new Error('network fail'));
    const { findByText } = render(<WeatherScreen />);
    const retry = await findByText('Дахин оролдох');
    mockGetByAimag.mockResolvedValueOnce(lowRiskPayload);
    fireEvent.press(retry);
    await waitFor(() => expect(mockGetByAimag).toHaveBeenCalledTimes(2));
  });
});
