import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton, SecondaryButton } from './_components';
import { useOnboarding } from './_layout';

type CampKey = 'winter' | 'spring' | 'summer' | 'autumn' | 'otor';

const CAMPS: Array<{ key: CampKey; label: string; emoji: string }> = [
  { key: 'winter', label: 'Өвөлжөө', emoji: '❄️' },
  { key: 'spring', label: 'Хаваржаа', emoji: '🌱' },
  { key: 'summer', label: 'Зуслан', emoji: '☀️' },
  { key: 'autumn', label: 'Намаржаа', emoji: '🍂' },
  { key: 'otor', label: 'Оторлох газар', emoji: '🐎' },
];

export default function SeasonalScreen() {
  const router = useRouter();
  const { data, updateSeasonal } = useOnboarding();
  const [loadingKey, setLoadingKey] = useState<CampKey | null>(null);

  const captureGps = async (key: CampKey) => {
    setLoadingKey(key);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Зөвшөөрөл', 'GPS-ийн зөвшөөрөл шаардлагатай');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      updateSeasonal(key, {
        ...data.seasonal[key],
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      Alert.alert('Алдаа', 'Байршил тогтоох боломжгүй');
    } finally {
      setLoadingKey(null);
    }
  };

  const updateNote = (key: CampKey, note: string) => {
    updateSeasonal(key, { ...data.seasonal[key], note });
  };

  const goNext = () => router.push('/onboarding/livestock' as any);

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader
        step={6}
        total={8}
        title="Улирлын байршил"
        subtitle="Өвөлжөө, хаваржаа, зуслан, намаржаа, оторлох газраа бүртгэнэ үү. Дараа ч нэмж болно."
      />
      <ScrollView contentContainerStyle={styles.body}>
        {CAMPS.map((c) => {
          const camp = data.seasonal[c.key];
          const hasGps = camp.lat != null && camp.lng != null;
          return (
            <View key={c.key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{c.emoji}</Text>
                <Text style={styles.cardTitle}>{c.label}</Text>
                {hasGps && <Text style={styles.gpsBadge}>📍 Бэлэн</Text>}
              </View>
              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={() => captureGps(c.key)}
                disabled={loadingKey === c.key}
              >
                {loadingKey === c.key ? (
                  <ActivityIndicator color={AppColors.primary} size="small" />
                ) : (
                  <Text style={styles.gpsBtnText}>
                    {hasGps ? 'GPS дахин авах' : '📍 GPS байршлыг авах'}
                  </Text>
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.noteInput}
                placeholder="Тэмдэглэл (заавал биш)"
                placeholderTextColor={AppColors.gray}
                value={camp.note || ''}
                onChangeText={(v) => updateNote(c.key, v)}
                multiline
              />
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Үргэлжлүүлэх" onPress={goNext} />
        <SecondaryButton label="Алгасах" onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  card: {
    backgroundColor: AppColors.grayLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: { fontSize: 22, marginRight: 10 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.black,
    flex: 1,
  },
  gpsBadge: { fontSize: 12, color: AppColors.primary, fontWeight: '700' },
  gpsBtn: {
    backgroundColor: AppColors.white,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  gpsBtnText: { color: AppColors.primary, fontSize: 13, fontWeight: '600' },
  noteInput: {
    backgroundColor: AppColors.white,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: AppColors.black,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
