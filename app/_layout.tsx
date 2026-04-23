import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetwork } from '@/hooks/use-network';
import { OfflineBanner } from '@/components/offline-banner';

const ONBOARDING_KEY = '@malchin_onboarding_done';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isConnected = useNetwork();
  const router = useRouter();
  const segments = useSegments();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingDone(done === 'true');
      } catch {
        setOnboardingDone(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (checkingOnboarding) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingDone && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [checkingOnboarding, onboardingDone, segments]);

  if (checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner visible={!isConnected} />
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lost-found" options={{ headerShown: false }} />
        <Stack.Screen name="bag-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="sum-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="malchin-khun" options={{ headerShown: false }} />
        <Stack.Screen name="family-future" options={{ headerShown: false }} />
        <Stack.Screen name="extra-income" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="coop-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="service-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-settings" options={{ headerShown: false }} />
        <Stack.Screen name="elder-content" options={{ headerShown: false }} />
        <Stack.Screen name="vet-booking" options={{ headerShown: false }} />
        <Stack.Screen name="wisdom-feed" options={{ headerShown: false }} />
        <Stack.Screen name="inbox" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
