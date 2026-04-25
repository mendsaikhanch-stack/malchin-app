import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { StepHeader, PrimaryButton } from '@/components/onboarding-ui';
import { useOnboarding, type Role } from './_layout';

const ROLES: Array<{
  id: Role;
  emoji: string;
  title: string;
  desc: string;
}> = [
  { id: 'malchin', emoji: '🐑', title: 'Малчин', desc: 'Мал маллаж амьдардаг' },
  { id: 'bag_darga', emoji: '👨‍💼', title: 'Багийн дарга', desc: 'Багийнхаа удирдлага' },
  { id: 'sum_admin', emoji: '🏛️', title: 'Сумын ажилтан', desc: 'Сумын засаг захиргаа' },
  { id: 'khorshoo', emoji: '🤝', title: 'Хоршоо', desc: 'Хоршооны гишүүн / гүйцэтгэх' },
  { id: 'service_provider', emoji: '🛠️', title: 'Үйлчилгээ үзүүлэгч', desc: 'Мал эмч, тээвэр, тэжээл г.м' },
];

export default function RoleScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const handleNext = () => {
    if (!data.role) {
      Alert.alert('Алдаа', 'Үүргээ сонгоно уу');
      return;
    }
    router.push('/onboarding/location' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader
        step={4}
        total={8}
        title="Та хэн бэ?"
        subtitle="Үүрэгт тань тохирсон апп бэлдэнэ"
      />
      <ScrollView contentContainerStyle={styles.body}>
        {ROLES.map((r) => {
          const selected = data.role === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => update({ role: r.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, selected && styles.titleSelected]}>
                  {r.title}
                </Text>
                <Text style={styles.desc}>{r.desc}</Text>
              </View>
              {selected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Үргэлжлүүлэх"
          onPress={handleNext}
          disabled={!data.role}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardSelected: { borderColor: AppColors.primary, backgroundColor: '#F0F9F2' },
  emoji: { fontSize: 32, marginRight: 14 },
  title: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  titleSelected: { color: AppColors.primary },
  desc: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  check: {
    fontSize: 22,
    color: AppColors.primary,
    fontWeight: '800',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
});
