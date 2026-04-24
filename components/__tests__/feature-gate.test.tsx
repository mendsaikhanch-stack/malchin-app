import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeatureGate, UpgradePrompt } from '../feature-gate';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const PACKAGE_KEY = '@malchin_package';

describe('FeatureGate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('free багц → free feature нээлттэй (children харагдана)', async () => {
    const { findByText } = render(
      <FeatureGate feature="weather_basic">
        <Text>Weather content</Text>
      </FeatureGate>
    );
    expect(await findByText('Weather content')).toBeTruthy();
  });

  it('free багц → premium feature → upgrade prompt default fallback', async () => {
    const { findByText, queryByText } = render(
      <FeatureGate feature="sum_dashboard_full">
        <Text>Advanced heatmap</Text>
      </FeatureGate>
    );
    // Children харагдахгүй
    await waitFor(() => {
      expect(queryByText('Advanced heatmap')).toBeNull();
    });
    // UpgradePrompt default — Сумын лиценз багцын нэр
    expect(await findByText(/Сумын лиценз/)).toBeTruthy();
  });

  it('custom fallback байвал default prompt оронд түүнийг харуулна', async () => {
    const { findByText, queryByText } = render(
      <FeatureGate
        feature="provider_booking"
        fallback={<Text>Custom locked notice</Text>}
      >
        <Text>Booking form</Text>
      </FeatureGate>
    );
    expect(await findByText('Custom locked notice')).toBeTruthy();
    expect(queryByText('Booking form')).toBeNull();
  });

  it('AsyncStorage-д хадгалсан premium_malchin → premium feature нээлттэй', async () => {
    await AsyncStorage.setItem(PACKAGE_KEY, 'premium_malchin');
    const { findByText } = render(
      <FeatureGate feature="advisory_unlimited">
        <Text>Unlimited advisory</Text>
      </FeatureGate>
    );
    expect(await findByText('Unlimited advisory')).toBeTruthy();
  });
});

describe('UpgradePrompt', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('free feature дээр null буцаана', () => {
    const { queryByText } = render(<UpgradePrompt feature="weather_basic" />);
    expect(queryByText(/багцад нээгдэнэ/)).toBeNull();
    expect(queryByText(/Багц харах/)).toBeNull();
  });

  it('premium feature дээр Премиум Малчин CTA харуулна', async () => {
    const { findByText } = render(
      <UpgradePrompt feature="advisory_unlimited" />
    );
    expect(await findByText(/Премиум Малчин/)).toBeTruthy();
    expect(await findByText('Багц харах')).toBeTruthy();
  });

  it('compact mode — row layout + эгц arrow', async () => {
    const { findByText, queryByText } = render(
      <UpgradePrompt feature="sum_dashboard_full" compact />
    );
    expect(await findByText(/Сумын лиценз/)).toBeTruthy();
    // Compact-д "Багц харах" button байхгүй — зөвхөн arrow
    expect(queryByText('Багц харах')).toBeNull();
  });
});
