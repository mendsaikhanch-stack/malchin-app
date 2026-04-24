import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetwork } from '@/hooks/use-network';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { OfflineBanner } from '@/components/offline-banner';

const ONBOARDING_KEY = '@malchin_onboarding_done';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isConnected = useNetwork();
  useAutoSync(); // Сүлжээ сэргэх бүрд queue-г flush хийнэ
  const router = useRouter();
  const segments = useSegments();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Segments солигдох бүрд AsyncStorage-ээс flag-г дахин уншина —
  // done.tsx-аас /(tabs) руу replace хийх үед state шинэчлэгдсэн байх
  // ёстой тул mount-д нэг л удаа уншсанаар алхам хоорондын гүйлт
  // алдагддаг байлаа (done=true set хийсний дараа state хуучин false
  // хэвээр тул буцаагаад /onboarding руу redirect хийж loop үүсдэг).
  useEffect(() => {
    let cancelled = false;
    const checkAndRedirect = async () => {
      try {
        const done = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
        if (cancelled) return;
        setCheckingOnboarding(false);

        const inOnboarding = segments[0] === 'onboarding';
        if (!done && !inOnboarding) {
          router.replace('/onboarding');
        } else if (done && inOnboarding) {
          router.replace('/(tabs)');
        }
      } catch {
        if (!cancelled) setCheckingOnboarding(false);
      }
    };
    checkAndRedirect();
    return () => { cancelled = true; };
  }, [segments]);

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
        <Stack.Screen name="advisory" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
