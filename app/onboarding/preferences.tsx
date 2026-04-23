import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton } from './_components';
import { useOnboarding, Preferences } from './_layout';

const CATEGORIES: Array<{
  key: keyof Preferences;
  emoji: string;
  label: string;
}> = [
  { key: 'weather', emoji: '⛅', label: 'Цаг агаар' },
  { key: 'alerts', emoji: '⚠️', label: 'Эрсдэл, сэрэмжлүүлэг' },
  { key: 'migration', emoji: '🐎', label: 'Нүүдэл / отор' },
  { key: 'livestock_advice', emoji: '🐑', label: 'Малын зөвлөгөө' },
  { key: 'feed', emoji: '🌾', label: 'Тэжээл' },
  { key: 'market', emoji: '📊', label: 'Зах зээл' },
  { key: 'listings', emoji: '📢', label: 'Зар' },
  { key: 'dairy', emoji: '🥛', label: 'Цагаан идээ' },
  { key: 'meat', emoji: '🥩', label: 'Мах борц' },
  { key: 'health', emoji: '🏥', label: 'Эрүүл мэнд' },
  { key: 'insurance', emoji: '🛡️', label: 'Даатгал' },
  { key: 'children', emoji: '👶', label: 'Хүүхэд, боловсрол' },
  { key: 'income', emoji: '💰', label: 'Орлого' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { data, togglePreference } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader
        step={8}
        total={8}
        title="Юу авахыг хүсэх вэ?"
        subtitle="Танд тохирсон мэдээллийг хүргэхийн тулд сонгоно уу"
      />
      <ScrollView contentContainerStyle={styles.body}>
        {CATEGORIES.map((c) => {
          const on = data.preferences[c.key];
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.row, on && styles.rowOn]}
              onPress={() => togglePreference(c.key)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{c.emoji}</Text>
              <Text style={[styles.label, on && styles.labelOn]}>{c.label}</Text>
              <View style={[styles.toggle, on && styles.toggleOn]}>
                <View style={[styles.toggleDot, on && styles.toggleDotOn]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Үргэлжлүүлэх"
          onPress={() => router.push('/onboarding/review' as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    backgroundColor: AppColors.white,
  },
  rowOn: { backgroundColor: '#F0F9F2', borderColor: AppColors.primary },
  emoji: { fontSize: 22, marginRight: 12 },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.black,
  },
  labelOn: { color: AppColors.primary },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.grayMedium,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: AppColors.primary },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.white,
  },
  toggleDotOn: { transform: [{ translateX: 18 }] },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
