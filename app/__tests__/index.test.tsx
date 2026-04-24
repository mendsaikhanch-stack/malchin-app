import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Mocks (hoisted) -------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('@/hooks/use-location', () => ({
  useLocation: () => ({ address: 'Төв, Алтанбулаг', loading: false }),
}));

jest.mock('@/hooks/use-user-role', () => ({
  useUserRole: () => ({ role: 'malchin', name: 'Бат' }),
  ROLE_LABEL: { malchin: 'Малчин', bag_darga: 'Багийн дарга' },
  ROLE_EMOJI: { malchin: '🐑', bag_darga: '👥' },
}));

jest.mock('@/components/ad-banner', () => ({
  AdBanner: () => null,
  AdBannerLarge: () => null,
}));

// Backend API call бүрд хоосон эсвэл минимум mock буцаана
jest.mock('@/services/api', () => ({
  livestockApi: {
    getStats: jest.fn().mockResolvedValue({
      total_animals: 150,
      livestock: [
        { animal_type: 'sheep', total_count: 100 },
        { animal_type: 'goat', total_count: 50 },
      ],
    }),
  },
  weatherApi: {
    getByAimagWithMeta: jest.fn().mockResolvedValue({
      data: { temp: 15, condition: 'clear', dzud_risk: 'low', wind: 3, humidity: 40, aimag: 'Төв' },
      provider: 'backend',
      fromCache: false, offline: false, expired: false,
    }),
  },
  alertsApi: {
    getAllWithMeta: jest.fn().mockResolvedValue({
      data: [],
      fromCache: false, offline: false, expired: false,
    }),
  },
  aiApi: {
    getTipWithMeta: jest.fn().mockResolvedValue({
      data: { tip: 'Өнөөдөр малаа ус уулгахыг мартуузай.' },
      fromCache: false, offline: false, expired: false,
    }),
  },
  financeApi: {
    getSummary: jest.fn().mockResolvedValue({
      total_income: 500000, total_expense: 200000, profit: 300000,
    }),
  },
  marketApi: {
    getAllWithMeta: jest.fn().mockResolvedValue({
      data: [],
      fromCache: false, offline: false, expired: false,
    }),
  },
  pricesApi: {
    getSummaryWithMeta: jest.fn().mockResolvedValue({
      data: { sheep: 250000, goat: 180000 },
      fromCache: false, offline: false, expired: false,
    }),
  },
  healthApi: {
    getStatsWithMeta: jest.fn().mockResolvedValue({
      data: { vaccinated: 100, sick: 2, healthy: 148 },
      fromCache: false, offline: false, expired: false,
    }),
  },
  newsApi: {
    getAllWithMeta: jest.fn().mockResolvedValue({
      data: [{ id: 1, title: 'Шинэ мэдэгдэл', content: 'Тоолого эхлэх' }],
      fromCache: false, offline: false, expired: false,
    }),
  },
}));

import HomeScreen from '../(tabs)/index';

// --- Setup -----------------------------------------------------------------

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    '@malchin_onboarding_data',
    JSON.stringify({
      phone: '99001122',
      lastName: 'Батын',
      firstName: 'Бат',
      role: 'malchin',
      aimag: 'Төв',
      sum: 'Алтанбулаг',
      bag: '3-р баг',
      livestock: { horse: 10, cow: 5, sheep: 100, goat: 50, camel: 0 },
    })
  );
});

// --- Tests -----------------------------------------------------------------

describe('HomeScreen — анхны render', () => {
  it('loading state эхлээд харагдана', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Ачааллаж байна/)).toBeTruthy();
  });

  it('ачаалсны дараа greeting + МАЛЧИН header render', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText(/Сайн байна уу, Бат!/)).toBeTruthy();
    expect(await findByText('МАЛЧИН')).toBeTruthy();
  });

  it('хэрэглэгчийн байршил header-т харагдана', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText(/Төв, Алтанбулаг/)).toBeTruthy();
  });
});

describe('HomeScreen — малын тоо card', () => {
  it('"Миний мал" card нийт 150 толгой', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('🐑 Миний мал')).toBeTruthy();
    expect(await findByText('150 толгой')).toBeTruthy();
  });

  it('хонь ба ямааны тоо зөв харагдана', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('100')).toBeTruthy();
    expect(await findByText('50')).toBeTruthy();
  });
});

describe('HomeScreen — цаг агаарын card', () => {
  it('Цаг агаар card + аймгийн нэр', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText(/Цаг агаар - Төв/)).toBeTruthy();
    expect(await findByText('15°C')).toBeTruthy();
  });

  it('зудын risk badge render', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText(/Зуд:/)).toBeTruthy();
  });
});

describe('HomeScreen — daily tasks + tip cards', () => {
  it('Өнөөдөр хийх 3 ажил card render', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('✅ Өнөөдөр хийх 3 ажил')).toBeTruthy();
  });

  it('Өдрийн зөвлөгөө card — aiApi.tip агуулгатай', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('💡 Өдрийн зөвлөгөө')).toBeTruthy();
    expect(await findByText(/малаа ус уулгахыг/)).toBeTruthy();
  });
});

describe('HomeScreen — role-нөхцөлт banner', () => {
  it('malchin role үед role banner харагдахгүй', async () => {
    const { queryByText, findByText } = render(<HomeScreen />);
    await findByText(/Сайн байна уу, Бат!/);
    // "хяналт" гэсэн banner нь зөвхөн non-malchin role-д
    expect(queryByText(/Малчин хяналт/)).toBeNull();
  });
});

describe('HomeScreen — API дуудлага', () => {
  it('mount үед 8 backend API дуудагдана', async () => {
    const api = require('@/services/api');
    const { findByText } = render(<HomeScreen />);
    await findByText('🐑 Миний мал');

    await waitFor(() => {
      expect(api.livestockApi.getStats).toHaveBeenCalled();
      expect(api.weatherApi.getByAimagWithMeta).toHaveBeenCalled();
      expect(api.alertsApi.getAllWithMeta).toHaveBeenCalled();
      expect(api.aiApi.getTipWithMeta).toHaveBeenCalled();
      expect(api.financeApi.getSummary).toHaveBeenCalled();
      expect(api.pricesApi.getSummaryWithMeta).toHaveBeenCalled();
      expect(api.marketApi.getAllWithMeta).toHaveBeenCalled();
      expect(api.healthApi.getStatsWithMeta).toHaveBeenCalled();
      expect(api.newsApi.getAllWithMeta).toHaveBeenCalled();
    });
  });
});
