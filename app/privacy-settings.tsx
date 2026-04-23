import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

const PRIVACY_KEY = '@malchin_privacy_settings';

type Level = 'exact' | 'bag' | 'sum' | 'off';

type PrivacySettings = {
  locationShareLevel: Level; // Миний байршил хэрхэн хуваалцах
  livestockShareWithBag: boolean;
  livestockShareWithCoop: boolean;
  healthDataShareWithFamily: boolean;
  adsPersonalized: boolean;
  chatReadReceipts: boolean;
  profileVisible: 'public' | 'bag' | 'private';
};

const DEFAULT: PrivacySettings = {
  locationShareLevel: 'bag',
  livestockShareWithBag: true,
  livestockShareWithCoop: false,
  healthDataShareWithFamily: false,
  adsPersonalized: true,
  chatReadReceipts: true,
  profileVisible: 'bag',
};

const LEVEL_DESC: Record<Level, { label: string; desc: string; emoji: string }> = {
  exact: { label: 'Нарийвчилсан (GPS)', desc: 'Ямар өрөө/айлтай байгаа нарийн байршил', emoji: '🎯' },
  bag: { label: 'Багийн түвшин', desc: 'Зөвхөн баг орчмын бүс', emoji: '📍' },
  sum: { label: 'Сумын түвшин', desc: 'Зөвхөн сумын ерөнхий бүс', emoji: '🗺️' },
  off: { label: 'Хаах', desc: 'Байршил огт хуваалцахгүй', emoji: '🚫' },
};

export default function PrivacySettings() {
  const router = useRouter();
  const [s, setS] = useState<PrivacySettings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PRIVACY_KEY).then((raw) => {
      if (raw) {
        try {
          setS({ ...DEFAULT, ...JSON.parse(raw) });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(s));
  }, [s, loaded]);

  const update = (partial: Partial<PrivacySettings>) =>
    setS((prev) => ({ ...prev, ...partial }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Нууцлал ба эрх</Text>
          <Text style={styles.headerSubtitle}>Та юу хэнд хуваалцахаа удирдах</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Байршил */}
        <Section title="📍 Байршил хуваалцах түвшин" subtitle="Хэн таны байршлыг харах эрхтэй вэ">
          {(['exact', 'bag', 'sum', 'off'] as Level[]).map((lv) => {
            const info = LEVEL_DESC[lv];
            const selected = s.locationShareLevel === lv;
            return (
              <TouchableOpacity
                key={lv}
                style={[styles.levelCard, selected && styles.levelCardActive]}
                onPress={() => update({ locationShareLevel: lv })}
              >
                <Text style={styles.levelEmoji}>{info.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelLabel, selected && styles.levelLabelActive]}>
                    {info.label}
                  </Text>
                  <Text style={styles.levelDesc}>{info.desc}</Text>
                </View>
                {selected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          <Text style={styles.note}>
            💡 Яг GPS-ийг ямар ч тохиолдолд олон нийтэд харуулахгүй. Зөвхөн таны сонгосон хэмжээний бүс л харагдана.
          </Text>
        </Section>

        {/* Мал */}
        <Section title="🐑 Малын мэдээлэл" subtitle="Малын тоо, нарийвчилсан бүртгэл">
          <ToggleRow
            label="Багийн даргатай хуваалцах"
            desc="Малын тоо, эрсдэлт мал үзэх эрх"
            value={s.livestockShareWithBag}
            onChange={(v) => update({ livestockShareWithBag: v })}
          />
          <ToggleRow
            label="Хоршоотой хуваалцах"
            desc="Зөвхөн нийт тоо (ноос/ноолуурын тооцоо)"
            value={s.livestockShareWithCoop}
            onChange={(v) => update({ livestockShareWithCoop: v })}
          />
        </Section>

        {/* Эрүүл мэнд */}
        <Section title="🩺 Эрүүл мэнд" subtitle="ЭМД, НДШ, эмнэлгийн бичлэг">
          <ToggleRow
            label="Гэр бүлтэй хуваалцах"
            desc="Зөвхөн өрхийн гишүүд харна"
            value={s.healthDataShareWithFamily}
            onChange={(v) => update({ healthDataShareWithFamily: v })}
          />
          <Text style={styles.note}>
            🔒 Эрүүл мэндийн өгөгдөл багийн дарга, сумын админд ХЭЗЭЭ Ч харагдахгүй.
          </Text>
        </Section>

        {/* Профайл */}
        <Section title="👤 Профайлын харагдах байдал">
          <RadioRow
            label="Хувийн"
            desc="Зөвхөн би харна"
            selected={s.profileVisible === 'private'}
            onPress={() => update({ profileVisible: 'private' })}
          />
          <RadioRow
            label="Багийн гишүүдэд"
            desc="Миний багийнхан"
            selected={s.profileVisible === 'bag'}
            onPress={() => update({ profileVisible: 'bag' })}
          />
          <RadioRow
            label="Нээлттэй"
            desc="Бүх хэрэглэгчид"
            selected={s.profileVisible === 'public'}
            onPress={() => update({ profileVisible: 'public' })}
          />
        </Section>

        {/* Чат */}
        <Section title="💬 Чат">
          <ToggleRow
            label="Уншсан тэмдэг харуулах"
            desc="Мессеж уншсан эсэхийг илгээсэн хүн мэдэх"
            value={s.chatReadReceipts}
            onChange={(v) => update({ chatReadReceipts: v })}
          />
        </Section>

        {/* Сурталчилгаа */}
        <Section title="📣 Сурталчилгаа">
          <ToggleRow
            label="Хувийн сурталчилгаа"
            desc="Миний сонирхолд үндэслэсэн зар"
            value={s.adsPersonalized}
            onChange={(v) => update({ adsPersonalized: v })}
          />
        </Section>

        {/* Өгөгдөл */}
        <Section title="📦 Миний өгөгдөл">
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() =>
              Alert.alert('Өгөгдөл татаж авах', 'Өөрийн бүх өгөгдлийг JSON файлаар авах (Phase 2)')
            }
          >
            <Text style={styles.dangerBtnText}>📥 Өгөгдлөө татаж авах</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: '#FFEBEE' }]}
            onPress={() =>
              Alert.alert(
                'Анхаар',
                'Бүртгэлээ устгах уу? Бүх өгөгдөл устгана. Буцаах боломжгүй.',
                [
                  { text: 'Үгүй', style: 'cancel' },
                  { text: 'Тийм', style: 'destructive', onPress: () => Alert.alert('Phase 2-д бүрэн хэрэгжинэ') },
                ]
              )
            }
          >
            <Text style={[styles.dangerBtnText, { color: AppColors.danger }]}>
              🗑️ Бүртгэлээ устгах
            </Text>
          </TouchableOpacity>
        </Section>

        <Text style={styles.footer}>
          Таны өөрчлөлтүүд автоматаар хадгалагдана.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: AppColors.grayMedium, true: AppColors.primary }}
      />
    </View>
  );
}

function RadioRow({ label, desc, selected, onPress }: { label: string; desc?: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  body: { padding: 16 },
  section: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  sectionSub: { fontSize: 12, color: AppColors.grayDark, marginTop: 4 },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: AppColors.grayMedium,
    marginBottom: 8,
  },
  levelCardActive: { borderColor: AppColors.primary, backgroundColor: '#F0FFF4' },
  levelEmoji: { fontSize: 24 },
  levelLabel: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  levelLabelActive: { color: AppColors.primary },
  levelDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  check: { fontSize: 22, color: AppColors.primary, fontWeight: '800' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  toggleDesc: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: AppColors.grayMedium,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: AppColors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.primary },
  note: {
    marginTop: 10, padding: 10, backgroundColor: '#FFFBEA', borderRadius: 8,
    fontSize: 12, color: AppColors.grayDark, lineHeight: 18,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  dangerBtn: {
    paddingVertical: 12, borderRadius: 10, backgroundColor: AppColors.grayLight,
    alignItems: 'center', marginBottom: 8,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  footer: { textAlign: 'center', fontSize: 11, color: AppColors.gray, marginTop: 10 },
});
