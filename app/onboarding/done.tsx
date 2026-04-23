import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/constants/theme';
import { PrimaryButton } from './_components';
import { useOnboarding } from './_layout';
import { userApi, livestockApi, setToken } from '@/services/api';

const ONBOARDING_KEY = '@malchin_onboarding_done';

export default function DoneScreen() {
  const router = useRouter();
  const { data, reset } = useOnboarding();
  const [submitting, setSubmitting] = useState(true);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    (async () => {
      const fullName = `${data.lastName} ${data.firstName}`.trim();
      try {
        const res = await userApi.create({
          phone: data.phone,
          name: fullName,
          aimag: data.aimag,
          sum: data.sum,
          bag: data.bag,
          role: data.role || 'malchin',
          seasonal: data.seasonal,
          preferences: data.preferences,
        });
        if (res?.token) await setToken(res.token);

        if (res?.user?.id) {
          const counts: Array<[string, number]> = [
            ['horse', data.livestock.horse],
            ['cow', data.livestock.cow],
            ['sheep', data.livestock.sheep],
            ['goat', data.livestock.goat],
            ['camel', data.livestock.camel],
          ];
          for (const [type, count] of counts) {
            if (count > 0) {
              try {
                await livestockApi.add({
                  user_id: res.user.id,
                  animal_type: type,
                  total_count: count,
                });
              } catch {
                // backend unavailable — onboarding data still in storage
              }
            }
          }
        }
      } catch {
        // backend unavailable — proceed offline; data is cached locally
      }

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setSubmitting(false);
    })();
  }, [data]);

  const handleFinish = async () => {
    await reset();
    router.replace('/(tabs)');
  };

  if (submitting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Бүртгэл хадгалаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Бэлэн боллоо!</Text>
        <Text style={styles.subtitle}>
          {data.firstName ? `${data.firstName}, ` : ''}тавтай морилно уу.
          {'\n'}Танд тохирсон мэдээллийг бэлдлээ.
        </Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Эхлэх" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.grayDark,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: { marginTop: 16, fontSize: 15, color: AppColors.grayDark },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
});
