import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import {
  fetchBagHouseholds,
  computeBagStats,
  filterRisky,
  RISK_LABEL,
  type Household,
  type BagStats,
} from '@/services/bag-dashboard-data';

const RISK_COLOR = {
  low: AppColors.success,
  medium: AppColors.warning,
  high: AppColors.danger,
};

export default function BagDashboard() {
  const router = useRouter();
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBagHouseholds()
      .then(setHouseholds)
      .finally(() => setLoading(false));
  }, []);

  const stats: BagStats = computeBagStats(households);
  const risky = filterRisky(households);

  const sendBroadcast = () => {
    if (!broadcastTitle || !broadcastBody) {
      Alert.alert('Алдаа', 'Гарчиг болон агуулгаа бичнэ үү');
      return;
    }
    Alert.alert('Илгээгдлээ', `${stats.totalHouseholds} өрхөд мэдэгдэл илгээлээ.`);
    setBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastBody('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Багийн даргын самбар</Text>
          <Text style={styles.headerSubtitle}>Алтанбулаг сум, 3-р баг</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.loadingText}>Өрхийн мэдээлэл ачааллаж байна...</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.body}>
        {/* Тоон үзүүлэлт */}
        <View style={styles.statsRow}>
          <Stat emoji="👪" label="Өрх" value={stats.totalHouseholds} />
          <Stat emoji="🐑" label="Мал" value={stats.totalAnimals} />
          <Stat emoji="⚠" label="Эрсдэлт" value={stats.riskyCount} color={AppColors.warning} />
          <Stat emoji="🚶" label="Отор" value={stats.otorCount} color={AppColors.accent} />
        </View>

        {/* Шуурхай үйлдэл */}
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
            onPress={() => Alert.alert('Тайлан', 'PDF тайлан үүсгэж байна...')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Тайлан гаргах</Text>
          </TouchableOpacity>
        </View>

        {/* Сумын сүүлийн мэдэгдэл */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Сумын сүүлийн мэдэгдэл</Text>
          <NotifItem
            title="Мал тооллого"
            body="4-р сарын 25-28-нд 3-р баг"
            date="2026-04-22"
            readPct={72}
          />
          <NotifItem
            title="Вакцинжуулалт"
            body="5-р сарын 10. Ямааны шүлхий"
            date="2026-04-20"
            readPct={95}
          />
        </View>

        {/* Эрсдэлт өрх */}
        {risky.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠ Эрсдэлт өрх ({risky.length})</Text>
            {risky.map((h) => (
              <HouseholdRow key={h.id} h={h} onPress={() => Alert.alert(h.head, h.location)} />
            ))}
          </View>
        )}

        {/* Өрхийн жагсаалт */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👪 Бүх өрх ({stats.totalHouseholds})</Text>
          {households.map((h) => (
            <HouseholdRow key={h.id} h={h} onPress={() => Alert.alert(h.head, h.location)} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      )}

      {/* Broadcast modal */}
      <Modal visible={broadcastModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Мэдэгдэл илгээх</Text>
            <Text style={styles.modalHint}>3-р багийн {stats.totalHouseholds} өрхөд хүрнэ</Text>

            <Text style={styles.label}>Гарчиг</Text>
            <TextInput
              style={styles.input}
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
              placeholder="Жишээ: Яаралтай хурал"
            />
            <Text style={styles.label}>Агуулга</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={broadcastBody}
              onChangeText={setBroadcastBody}
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ emoji, label, value, color }: { emoji: string; label: string; value: number; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NotifItem({ title, body, date, readPct }: { title: string; body: string; date: string; readPct: number }) {
  const color = readPct >= 80 ? AppColors.success : readPct >= 50 ? AppColors.warning : AppColors.danger;
  return (
    <View style={styles.notifItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.notifTitle}>{title}</Text>
        <Text style={styles.notifBody}>{body}</Text>
        <Text style={styles.notifDate}>{date}</Text>
      </View>
      <View style={styles.readBadge}>
        <Text style={[styles.readValue, { color }]}>{readPct}%</Text>
        <Text style={styles.readLabel}>уншсан</Text>
      </View>
    </View>
  );
}

function HouseholdRow({ h, onPress }: { h: Household; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.hhRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.hhName}>{h.head}</Text>
          {h.otor && <Text style={styles.otorBadge}>🚶 отор</Text>}
        </View>
        <Text style={styles.hhInfo}>
          👪 {h.members} хүн · 🐑 {h.animals} · 📍 {h.location}
        </Text>
        <Text style={styles.hhActive}>Сүүлд идэвхжсэн: {h.lastActive}</Text>
      </View>
      <View style={[styles.riskDot, { backgroundColor: RISK_COLOR[h.risk] }]}>
        <Text style={styles.riskText}>{RISK_LABEL[h.risk]}</Text>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: AppColors.grayDark },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 12, padding: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: '800', color: AppColors.black, marginTop: 4 },
  statLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', gap: 4,
  },
  actionIcon: { fontSize: 24 },
  actionText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  notifTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  notifBody: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  notifDate: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  readBadge: { alignItems: 'center' },
  readValue: { fontSize: 16, fontWeight: '800' },
  readLabel: { fontSize: 10, color: AppColors.grayDark },
  hhRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  hhName: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  otorBadge: { fontSize: 11, color: AppColors.accent },
  hhInfo: { fontSize: 12, color: AppColors.grayDark, marginTop: 3 },
  hhActive: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  riskDot: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  riskText: { fontSize: 10, color: AppColors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black },
  modalHint: { fontSize: 12, color: AppColors.grayDark, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AppColors.grayMedium, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.grayLight },
  btnPrimaryText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  btnSecondaryText: { color: AppColors.black, fontSize: 15, fontWeight: '600' },
});
