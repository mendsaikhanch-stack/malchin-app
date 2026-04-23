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
import { StepHeader, PrimaryButton, SecondaryButton } from './_components';
import { useOnboarding, LivestockCounts } from './_layout';

const TYPES: Array<{ key: keyof LivestockCounts; label: string; emoji: string }> = [
  { key: 'horse', label: 'Адуу', emoji: '🐎' },
  { key: 'cow', label: 'Үхэр', emoji: '🐄' },
  { key: 'sheep', label: 'Хонь', emoji: '🐑' },
  { key: 'goat', label: 'Ямаа', emoji: '🐐' },
  { key: 'camel', label: 'Тэмээ', emoji: '🐪' },
];

const SUBTYPES: Array<{ key: keyof LivestockCounts; label: string }> = [
  { key: 'youngStock', label: 'Төл мал' },
  { key: 'milkStock', label: 'Саалийн мал' },
  { key: 'pregnantStock', label: 'Хээлтэй мал' },
  { key: 'weakStock', label: 'Сул дорой мал' },
];

function StepperBig({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const inc = (n: number) => onChange(Math.max(0, value + n));
  return (
    <View style={styles.stepperBig}>
      <TouchableOpacity style={styles.bigBtn} onPress={() => inc(-10)}>
        <Text style={styles.bigBtnText}>−10</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bigBtn} onPress={() => inc(-1)}>
        <Text style={styles.bigBtnText}>−1</Text>
      </TouchableOpacity>
      <Text style={styles.stepValueBig}>{value}</Text>
      <TouchableOpacity style={styles.bigBtn} onPress={() => inc(1)}>
        <Text style={styles.bigBtnText}>+1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bigBtn} onPress={() => inc(10)}>
        <Text style={styles.bigBtnText}>+10</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(0, value - 1))}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(value + 1)}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LivestockScreen() {
  const router = useRouter();
  const { data, updateLivestock } = useOnboarding();

  const totalMain = TYPES.reduce(
    (s, t) => s + (data.livestock[t.key] as number),
    0
  );

  const goNext = () => router.push('/onboarding/preferences' as any);

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader
        step={7}
        total={8}
        title="Малын тоо"
        subtitle="Малын төрөл бүрийн тоо толгойг оруулна уу"
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Нийт</Text>
          <Text style={styles.totalValue}>{totalMain} толгой</Text>
        </View>

        {TYPES.map((t) => (
          <View key={t.key} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.emoji}>{t.emoji}</Text>
              <Text style={styles.rowLabel}>{t.label}</Text>
            </View>
            <StepperBig
              value={data.livestock[t.key]}
              onChange={(n) => updateLivestock(t.key, n)}
            />
          </View>
        ))}

        <Text style={styles.sectionTitle}>Нэмэлт ангилал (заавал биш)</Text>
        {SUBTYPES.map((s) => (
          <View key={s.key} style={styles.subRow}>
            <Text style={styles.subLabel}>{s.label}</Text>
            <Stepper
              value={data.livestock[s.key]}
              onChange={(n) => updateLivestock(s.key, n)}
            />
          </View>
        ))}
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
  totalCard: {
    backgroundColor: AppColors.primary,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { color: AppColors.white, fontSize: 14, fontWeight: '600' },
  totalValue: { color: AppColors.white, fontSize: 22, fontWeight: '800' },
  row: {
    backgroundColor: AppColors.grayLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emoji: { fontSize: 24, marginRight: 10 },
  rowLabel: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  stepperBig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bigBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: AppColors.white,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  bigBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.primary },
  stepValueBig: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.black,
    minWidth: 50,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.grayDark,
    marginTop: 16,
    marginBottom: 8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayLight,
  },
  subLabel: { fontSize: 15, color: AppColors.black, flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '700', color: AppColors.primary },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.black,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
