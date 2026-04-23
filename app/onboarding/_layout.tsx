import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@malchin_onboarding_data';

export type Role =
  | 'malchin'
  | 'bag_darga'
  | 'sum_admin'
  | 'khorshoo'
  | 'service_provider';

export type SeasonalCamp = {
  lat?: number;
  lng?: number;
  note?: string;
};

export type LivestockCounts = {
  horse: number;
  cow: number;
  sheep: number;
  goat: number;
  camel: number;
  youngStock: number;
  milkStock: number;
  pregnantStock: number;
  weakStock: number;
};

export type Preferences = {
  weather: boolean;
  alerts: boolean;
  migration: boolean;
  livestock_advice: boolean;
  feed: boolean;
  market: boolean;
  listings: boolean;
  dairy: boolean;
  meat: boolean;
  health: boolean;
  insurance: boolean;
  children: boolean;
  income: boolean;
};

export type OnboardingData = {
  phone: string;
  otpVerified: boolean;
  lastName: string;
  firstName: string;
  role: Role | null;
  aimag: string;
  sum: string;
  bag: string;
  seasonal: {
    winter: SeasonalCamp;
    spring: SeasonalCamp;
    summer: SeasonalCamp;
    autumn: SeasonalCamp;
    otor: SeasonalCamp;
  };
  livestock: LivestockCounts;
  preferences: Preferences;
};

const DEFAULT_DATA: OnboardingData = {
  phone: '',
  otpVerified: false,
  lastName: '',
  firstName: '',
  role: null,
  aimag: '',
  sum: '',
  bag: '',
  seasonal: { winter: {}, spring: {}, summer: {}, autumn: {}, otor: {} },
  livestock: {
    horse: 0,
    cow: 0,
    sheep: 0,
    goat: 0,
    camel: 0,
    youngStock: 0,
    milkStock: 0,
    pregnantStock: 0,
    weakStock: 0,
  },
  preferences: {
    weather: true,
    alerts: true,
    migration: true,
    livestock_advice: true,
    feed: true,
    market: true,
    listings: true,
    dairy: false,
    meat: false,
    health: true,
    insurance: true,
    children: false,
    income: false,
  },
};

type ContextValue = {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  updateSeasonal: (
    key: keyof OnboardingData['seasonal'],
    value: SeasonalCamp
  ) => void;
  updateLivestock: (key: keyof LivestockCounts, value: number) => void;
  togglePreference: (key: keyof Preferences) => void;
  reset: () => Promise<void>;
};

const OnboardingContext = createContext<ContextValue | null>(null);

export function useOnboarding(): ContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

export default function OnboardingLayout() {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((s) => {
        if (s) {
          try {
            setData({ ...DEFAULT_DATA, ...JSON.parse(s) });
          } catch {
            // ignore parse errors
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const updateSeasonal = (
    key: keyof OnboardingData['seasonal'],
    value: SeasonalCamp
  ) =>
    setData((prev) => ({
      ...prev,
      seasonal: { ...prev.seasonal, [key]: value },
    }));

  const updateLivestock = (key: keyof LivestockCounts, value: number) =>
    setData((prev) => ({
      ...prev,
      livestock: { ...prev.livestock, [key]: Math.max(0, value) },
    }));

  const togglePreference = (key: keyof Preferences) =>
    setData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: !prev.preferences[key] },
    }));

  const reset = async () => {
    setData(DEFAULT_DATA);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        update,
        updateSeasonal,
        updateLivestock,
        togglePreference,
        reset,
      }}
    >
      <Stack
        screenOptions={{ headerShown: false, gestureEnabled: false }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="phone" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="name" />
        <Stack.Screen name="role" />
        <Stack.Screen name="location" />
        <Stack.Screen name="seasonal" />
        <Stack.Screen name="livestock" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="done" />
      </Stack>
    </OnboardingContext.Provider>
  );
}
