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
import { PrimaryButton } from './_components';
import { useOnboarding, Role, LivestockCounts, Preferences } from './_layout';

const ROLE_LABELS: Record<Role, string> = {
  malchin: 'Малчин',
  bag_darga: 'Багийн дарга',
  sum_admin: 'Сумын ажилтан',
  khorshoo: 'Хоршоо',
  service_provider: 'Үйлчилгээ үзүүлэгч',
};

const LIVESTOCK_LABELS: Record<keyof LivestockCounts, string> = {
  horse: 'Адуу',
  cow: 'Үхэр',
  sheep: 'Хонь',
  goat: 'Ямаа',
  camel: 'Тэмээ',
  youngStock: 'Төл мал',
  milkStock: 'Саалийн',
  pregnantStock: 'Хээлтэй',
  weakStock: 'Сул дорой',
};

const PREF_LABELS: Record<keyof Preferences, string> = {
  weather: 'Цаг агаар',
  alerts: 'Эрсдэл',
  migration: 'Нүүдэл',
  livestock_advice: 'Малын зөвлөгөө',
  feed: 'Тэжээл',
  market: 'Зах зээл',
  listings: 'Зар',
  dairy: 'Цагаан идээ',
  meat: 'Мах борц',
  health: 'Эрүүл мэнд',
  insurance: 'Даатгал',
  children: 'Хүүхэд',
  income: 'Орлого',
};

const SEASONAL_LABELS: Array<{
  key: 'winter' | 'spring' | 'summer' | 'autumn' | 'otor';
  label: string;
}> = [
  { key: 'winter', label: 'Өвөлжөө' },
  { key: 'spring', label: 'Хаваржаа' },
  { key: 'summer', label: 'Зуслан' },
  { key: 'autumn', label: 'Намаржаа' },
  { key: 'otor', label: 'Отор' },
];

export default function ReviewScreen() {
  const router = useRouter();
  const { data } = useOnboarding();

  const fullName = `${data.lastName} ${data.firstName}`.trim() || '—';
  const roleLabel = data.role ? ROLE_LABELS[data.role] : '—';
  const locationLabel = [data.aimag, data.sum, data.bag]
    .filter(Boolean)
    .join(', ') || '—';

  const seasonalSet = SEASONAL_LABELS.filter(
    (s) => data.seasonal[s.key].lat != null
  ).map((s) => s.label);

  const mainAnimals = (['horse', 'cow', 'sheep', 'goat', 'camel'] as const)
    .filter((k) => data.livestock[k] > 0)
    .map((k) => `${LIVESTOCK_LABELS[k]} ${data.livestock[k]}`);

  const totalLivestock = (['horse', 'cow', 'sheep', 'goat', 'camel'] as const)
    .reduce((s, k) => s + data.livestock[k], 0);

  const activePrefs = (Object.keys(PREF_LABELS) as Array<keyof Preferences>)
    .filter((k) => data.preferences[k])
    .map((k) => PREF_LABELS[k]);

  const goEdit = (step: string) => router.push(`/onboarding/${step}` as any);
  const submit = () => router.push('/onboarding/done' as any);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Шалгах</Text>
        <View style={styles.backBtn} />
      </View>
      <Text style={styles.subtitle}>
        Бүртгэлийн мэдээлэл зөв эсэхээ шалгаад баталгаажуулна уу
      </Text>

      <ScrollView contentContainerStyle={styles.body}>
        <Section title="Утас" step="phone" onEdit={goEdit}>
          <Text style={styles.value}>+976 {data.phone || '—'}</Text>
        </Section>

        <Section title="Нэр" step="name" onEdit={goEdit}>
          <Text style={styles.value}>{fullName}</Text>
        </Section>

        <Section title="Үүрэг" step="role" onEdit={goEdit}>
          <Text style={styles.value}>{roleLabel}</Text>
        </Section>

        <Section title="Байршил" step="location" onEdit={goEdit}>
          <Text style={styles.value}>{locationLabel}</Text>
        </Section>

        <Section title="Улирлын отор" step="seasonal" onEdit={goEdit}>
          <Text style={styles.value}>
            {seasonalSet.length > 0
              ? seasonalSet.join(', ')
              : 'Бүртгээгүй'}
          </Text>
        </Section>

        <Section title="Мал" step="livestock" onEdit={goEdit}>
          <Text style={styles.valueStrong}>{totalLivestock} толгой</Text>
          {mainAnimals.length > 0 ? (
            <Text style={styles.valueDim}>{mainAnimals.join(' · ')}</Text>
          ) : null}
        </Section>

        <Section title="Сонирхсон сэдэв" step="preferences" onEdit={goEdit}>
          <Text style={styles.value}>
            {activePrefs.length > 0
              ? `${activePrefs.length} сонгосон: ${activePrefs.slice(0, 4).join(', ')}${activePrefs.length > 4 ? '...' : ''}`
              : 'Сонгоогүй'}
          </Text>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Баталгаажуулж дуусгах" onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: string;
  onEdit: (step: string) => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={() => onEdit(step)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editLink}>Засах</Text>
        </TouchableOpacity>
      </View>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.black,
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.black,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.grayDark,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    lineHeight: 20,
  },
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  section: {
    backgroundColor: AppColors.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.grayDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  value: {
    fontSize: 16,
    color: AppColors.black,
    fontWeight: '600',
  },
  valueStrong: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.black,
  },
  valueDim: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
