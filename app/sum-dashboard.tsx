import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type BagStat = {
  id: string;
  name: string;
  households: number;
  animals: number;
  active: number; // active users last 7d
  risky: number;
  otor: number;
  readPct: number;
};

const MOCK_BAGS: BagStat[] = [
  { id: '1', name: '1-р баг (Хараат)', households: 72, animals: 18400, active: 58, risky: 4, otor: 12, readPct: 82 },
  { id: '2', name: '2-р баг (Баян-Улаан)', households: 65, animals: 15200, active: 52, risky: 6, otor: 8, readPct: 76 },
  { id: '3', name: '3-р баг (Цагаан-Овоо)', households: 58, animals: 13800, active: 47, risky: 3, otor: 15, readPct: 88 },
  { id: '4', name: '4-р баг (Хөх-Гол)', households: 49, animals: 11500, active: 35, risky: 8, otor: 5, readPct: 60 },
  { id: '5', name: '5-р баг (Цэнгэг)', households: 62, animals: 14700, active: 51, risky: 4, otor: 10, readPct: 81 },
];

const MOCK_EVENTS = [
  { id: '1', title: 'Хаврын тоолго', date: '2026-04-25', participation: 68 },
  { id: '2', title: 'Вакцинжуулалт', date: '2026-05-10', participation: 92 },
  { id: '3', title: 'Бэлчээр ашиглалтын хурал', date: '2026-05-15', participation: 45 },
];

export default function SumDashboard() {
  const router = useRouter();
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [scope, setScope] = useState<'all' | string>('all');
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');

  const totalHH = MOCK_BAGS.reduce((s, b) => s + b.households, 0);
  const totalAnimals = MOCK_BAGS.reduce((s, b) => s + b.animals, 0);
  const totalRisky = MOCK_BAGS.reduce((s, b) => s + b.risky, 0);
  const totalOtor = MOCK_BAGS.reduce((s, b) => s + b.otor, 0);
  const avgRead = Math.round(MOCK_BAGS.reduce((s, b) => s + b.readPct, 0) / MOCK_BAGS.length);
  const totalActive = MOCK_BAGS.reduce((s, b) => s + b.active, 0);
  const engagementPct = Math.round((totalActive / totalHH) * 100);

  const sorted = [...MOCK_BAGS].sort((a, b) => b.readPct - a.readPct);

  const sendBroadcast = () => {
    if (!bTitle || !bBody) {
      Alert.alert('Алдаа', 'Гарчиг болон агуулгаа бичнэ үү');
      return;
    }
    const target = scope === 'all' ? `бүх ${totalHH} өрх` : `${MOCK_BAGS.find((b) => b.id === scope)?.name}`;
    Alert.alert('Илгээгдлээ', `${target}-д мэдэгдэл илгээлээ.`);
    setBroadcastModal(false);
    setBTitle('');
    setBBody('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Сумын хяналтын самбар</Text>
          <Text style={styles.headerSubtitle}>Төв аймаг · Алтанбулаг сум</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Том үзүүлэлт */}
        <View style={styles.heroRow}>
          <HeroCard label="Нийт өрх" value={totalHH} sub={`${MOCK_BAGS.length} баг`} />
          <HeroCard label="Нийт мал" value={totalAnimals} sub="бодотой" fmt />
        </View>
        <View style={styles.heroRow}>
          <HeroCard label="Эрсдэлт" value={totalRisky} sub="өрх" color={AppColors.danger} />
          <HeroCard label="Отор" value={totalOtor} sub="өрх" color={AppColors.accent} />
        </View>

        {/* Engagement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Идэвхи ба хүрэлцээ</Text>
          <KpiRow label="Эрэлтэй хэрэглэгч (7 хоног)" value={`${engagementPct}%`} sub={`${totalActive}/${totalHH}`} />
          <KpiRow label="Мэдэгдлийн уншилт" value={`${avgRead}%`} sub="дундаж" />
          <KpiRow label="7 хоногийн шинэ бүртгэл" value="14" sub="өрх" />
        </View>

        {/* Эрсдэлийн зураг */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>🗺 Эрсдэлийн зураг</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map-view' as any)}>
              <Text style={styles.linkText}>Газрын зураг ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            <Text style={styles.mapPlaceholderText}>
              Heatmap — эрсдэлт бүс, отор чиглэл, усны эх үүсвэр
            </Text>
            <Text style={styles.mapPlaceholderHint}>(Phase 2: NDVI + эрсдэлийн layer)</Text>
          </View>
        </View>

        {/* Баг харьцуулалт */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Багуудын ranking (уншсан %)</Text>
          {sorted.map((b, i) => (
            <View key={b.id} style={styles.bagRow}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bagName}>{b.name}</Text>
                <Text style={styles.bagInfo}>
                  👪 {b.households} · 🐑 {b.animals.toLocaleString()} · ⚠ {b.risky}
                </Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { width: `${b.readPct}%`, backgroundColor: b.readPct >= 80 ? AppColors.success : b.readPct >= 60 ? AppColors.warning : AppColors.danger }]} />
                </View>
              </View>
              <Text style={styles.bagPct}>{b.readPct}%</Text>
            </View>
          ))}
        </View>

        {/* Арга хэмжээ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Арга хэмжээний оролцоо</Text>
          {MOCK_EVENTS.map((e) => (
            <View key={e.id} style={styles.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventDate}>{e.date}</Text>
              </View>
              <View style={styles.eventPct}>
                <Text style={[styles.eventPctValue, {
                  color: e.participation >= 80 ? AppColors.success : e.participation >= 60 ? AppColors.warning : AppColors.danger,
                }]}>
                  {e.participation}%
                </Text>
                <Text style={styles.eventPctLabel}>оролцоо</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Үйлдэл */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.primary }]}
            onPress={() => setBroadcastModal(true)}
          >
            <Text style={styles.actionIcon}>📢</Text>
            <Text style={styles.actionText}>Мэдэгдэл илгээх</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.accent }]}
            onPress={() => Alert.alert('Тайлан', 'Сарын тайлан PDF үүсгэж байна...')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Тайлан</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Broadcast modal */}
      <Modal visible={broadcastModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Мэдэгдэл илгээх</Text>

              <Text style={styles.label}>Хүлээн авагч</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, scope === 'all' && styles.chipActive]}
                  onPress={() => setScope('all')}
                >
                  <Text style={[styles.chipText, scope === 'all' && styles.chipTextActive]}>
                    Бүх баг ({totalHH})
                  </Text>
                </TouchableOpacity>
                {MOCK_BAGS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chip, scope === b.id && styles.chipActive]}
                    onPress={() => setScope(b.id)}
                  >
                    <Text style={[styles.chipText, scope === b.id && styles.chipTextActive]}>
                      {b.name.split(' ')[0]} ({b.households})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Гарчиг</Text>
              <TextInput
                style={styles.input}
                value={bTitle}
                onChangeText={setBTitle}
                placeholder="Жишээ: Тооллогын хуваарь"
              />
              <Text style={styles.label}>Агуулга</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                multiline
                value={bBody}
                onChangeText={setBBody}
                placeholder="Дэлгэрэнгүй мэдээлэл..."
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => setBroadcastModal(false)}
                >
                  <Text style={styles.btnSecondaryText}>Цуцлах</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={sendBroadcast}
                >
                  <Text style={styles.btnPrimaryText}>Илгээх</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HeroCard({ label, value, sub, color, fmt }: { label: string; value: number; sub?: string; color?: string; fmt?: boolean }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroLabel}>{label}</Text>
      <Text style={[styles.heroValue, color ? { color } : null]}>
        {fmt ? value.toLocaleString() : value}
      </Text>
      {sub ? <Text style={styles.heroSub}>{sub}</Text> : null}
    </View>
  );
}

function KpiRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpiRow}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.kpiValue}>{value}</Text>
        {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
      </View>
    </View>
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
  heroRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  hero: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  heroLabel: { fontSize: 12, color: AppColors.grayDark },
  heroValue: { fontSize: 22, fontWeight: '800', color: AppColors.black, marginTop: 6 },
  heroSub: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  linkText: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
  mapPlaceholder: {
    backgroundColor: '#F0FFF4', borderRadius: 12, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#C6F6D5', borderStyle: 'dashed',
  },
  mapPlaceholderIcon: { fontSize: 48 },
  mapPlaceholderText: { fontSize: 13, color: AppColors.grayDark, marginTop: 8, textAlign: 'center' },
  mapPlaceholderHint: { fontSize: 11, color: AppColors.gray, marginTop: 4 },
  kpiRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  kpiLabel: { fontSize: 13, color: AppColors.grayDark, flex: 1 },
  kpiValue: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  kpiSub: { fontSize: 11, color: AppColors.gray, marginTop: 1 },
  bagRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight, gap: 10,
  },
  rankCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  bagName: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  bagInfo: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  barOuter: {
    marginTop: 6, height: 6, backgroundColor: AppColors.grayLight, borderRadius: 3, overflow: 'hidden',
  },
  barInner: { height: '100%', borderRadius: 3 },
  bagPct: { fontSize: 14, fontWeight: '700', color: AppColors.black, minWidth: 40, textAlign: 'right' },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  eventTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  eventDate: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  eventPct: { alignItems: 'center' },
  eventPctValue: { fontSize: 16, fontWeight: '800' },
  eventPctLabel: { fontSize: 10, color: AppColors.grayDark },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 24 },
  actionText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AppColors.grayMedium, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, color: AppColors.black },
  chipTextActive: { color: AppColors.white, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.grayLight },
  btnPrimaryText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  btnSecondaryText: { color: AppColors.black, fontSize: 15, fontWeight: '600' },
});
