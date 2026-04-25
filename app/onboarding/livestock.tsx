import React, { useState } from 'react';
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
import { StepHeader, PrimaryButton, SecondaryButton } from '@/components/onboarding-ui';
import { useOnboarding, SpeciesKey, SubKey } from './_layout';

const TYPES: { key: SpeciesKey; label: string; emoji: string }[] = [
  { key: 'horse', label: 'Адуу', emoji: '🐎' },
  { key: 'cow', label: 'Үхэр', emoji: '🐄' },
  { key: 'sheep', label: 'Хонь', emoji: '🐑' },
  { key: 'goat', label: 'Ямаа', emoji: '🐐' },
  { key: 'camel', label: 'Тэмээ', emoji: '🐪' },
];

const SUBTYPES: { key: SubKey; label: string; emoji: string }[] = [
  { key: 'young', label: 'Төл', emoji: '🐣' },
  { key: 'milk', label: 'Саалийн', emoji: '🥛' },
  { key: 'pregnant', label: 'Хээлтэй', emoji: '🐄' },
  { key: 'weak', label: 'Сул дорой', emoji: '🩹' },
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

function StepperSmall({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepperSmall}>
      <TouchableOpacity style={styles.smallBtn} onPress={() => onChange(Math.max(0, value - 1))}>
        <Text style={styles.smallBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.smallValue}>{value}</Text>
      <TouchableOpacity style={styles.smallBtn} onPress={() => onChange(value + 1)}>
        <Text style={styles.smallBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LivestockScreen() {
  const router = useRouter();
  const { data, updateLivestock, updateSubCount } = useOnboarding();
  const [expanded, setExpanded] = useState<SpeciesKey | null>(null);

  const totalMain = TYPES.reduce((s, t) => s + data.livestock[t.key], 0);

  const goNext = () => router.push('/onboarding/preferences' as any);

  const subTotalOf = (species: SpeciesKey) => {
    const sc = data.livestock.subCounts?.[species];
    if (!sc) return 0;
    return (sc.young || 0) + (sc.milk || 0) + (sc.pregnant || 0) + (sc.weak || 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader
        step={7}
        total={8}
        title="Малын тоо"
        subtitle="Малын төрөл бүрийн тоо толгой, төл, саалийн, хээлтэй, сул дорой малын тоо"
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Нийт</Text>
          <Text style={styles.totalValue}>{totalMain} толгой</Text>
        </View>

        {TYPES.map((t) => {
          const isExpanded = expanded === t.key;
          const subTotal = subTotalOf(t.key);
          const hasAnimals = data.livestock[t.key] > 0;
          return (
            <View key={t.key} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.emoji}>{t.emoji}</Text>
                <Text style={styles.rowLabel}>{t.label}</Text>
                {hasAnimals && subTotal > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>төл {subTotal}</Text>
                  </View>
                )}
              </View>
              <StepperBig
                value={data.livestock[t.key]}
                onChange={(n) => updateLivestock(t.key, n)}
              />

              {/* Expand row */}
              {hasAnimals && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setExpanded(isExpanded ? null : t.key)}
                >
                  <Text style={styles.expandText}>
                    {isExpanded ? '▲ Хаах' : '▼ Төл, саалийн, хээлтэй, сул дорой'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Expandable subtypes */}
              {isExpanded && hasAnimals && (
                <View style={styles.subtypesBox}>
                  {SUBTYPES.map((s) => (
                    <View key={s.key} style={styles.subRow}>
                      <View style={styles.subLabelBox}>
                        <Text style={styles.subEmoji}>{s.emoji}</Text>
                        <Text style={styles.subLabel}>{s.label}</Text>
                      </View>
                      <StepperSmall
                        value={data.livestock.subCounts?.[t.key]?.[s.key] ?? 0}
                        onChange={(n) => updateSubCount(t.key, s.key, n)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.hint}>
          💡 Малын тоо бүртгэсний дараа төрөл тус бүр дээр "▼ Төл, саалийн..."
          дарвал дэлгэрэнгүй тоог оруулж болно.
        </Text>
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
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  emoji: { fontSize: 24, marginRight: 6 },
  rowLabel: { fontSize: 16, fontWeight: '700', color: AppColors.black, flex: 1 },
  badge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
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
  expandBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 8,
  },
  expandText: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
  subtypesBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: AppColors.white,
    borderRadius: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayLight,
  },
  subLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  subEmoji: { fontSize: 18 },
  subLabel: { fontSize: 14, color: AppColors.black, fontWeight: '600' },
  stepperSmall: { flexDirection: 'row', alignItems: 'center' },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { fontSize: 18, fontWeight: '700', color: AppColors.primary },
  smallValue: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.black,
    minWidth: 36,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: AppColors.grayDark,
    lineHeight: 18,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFBEA',
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
