import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Booking = {
  id: string;
  client: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'accepted' | 'done' | 'cancelled';
  price?: string;
  note?: string;
};

const MOCK: Booking[] = [
  { id: '1', client: 'Батбаяр.Б', phone: '99112233', service: 'Вакцинжуулалт (100 ямаа)', date: '2026-04-23', time: '10:00', location: '3-р баг, Хүрэн-Овоо', status: 'pending', price: '250,000₮' },
  { id: '2', client: 'Оюунтуяа.Д', phone: '88223344', service: 'Төллөлтийн туслалцаа', date: '2026-04-23', time: '14:00', location: '2-р баг', status: 'accepted', price: '150,000₮' },
  { id: '3', client: 'Дорж.Т', phone: '99556677', service: 'Ерөнхий үзлэг (үхэр)', date: '2026-04-24', time: '09:00', location: 'Отор — Баянжаргалан', status: 'accepted', price: '80,000₮' },
  { id: '4', client: 'Насанбат.Ц', phone: '99667788', service: 'Вакцинжуулалт', date: '2026-04-20', time: '11:00', location: '3-р баг', status: 'done', price: '180,000₮' },
];

const STATUS_COLOR: Record<Booking['status'], string> = {
  pending: AppColors.warning,
  accepted: AppColors.accent,
  done: AppColors.success,
  cancelled: AppColors.gray,
};
const STATUS_LABEL: Record<Booking['status'], string> = {
  pending: 'Хүлээгдэж',
  accepted: 'Хүлээн авсан',
  done: 'Дууссан',
  cancelled: 'Цуцалсан',
};

export default function ServiceDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(MOCK);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'done'>('all');

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const todayCount = bookings.filter((b) => b.date === '2026-04-23').length;
  const monthRevenue = bookings
    .filter((b) => b.status === 'done')
    .reduce((s, b) => {
      const val = parseInt((b.price || '0').replace(/[^\d]/g, ''));
      return s + val;
    }, 0);

  const updateStatus = (id: string, status: Booking['status']) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Үйлчилгээний самбар</Text>
          <Text style={styles.headerSubtitle}>Мал эмч — Баатар.Д</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Тоо */}
        <View style={styles.statsRow}>
          <Stat emoji="⏳" label="Хүлээж буй" value={String(pendingCount)} color={AppColors.warning} />
          <Stat emoji="📅" label="Өнөөдөр" value={String(todayCount)} />
          <Stat emoji="💰" label="Сарын орлого" value={`${(monthRevenue / 1000).toFixed(0)}К₮`} color={AppColors.success} />
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['all', 'pending', 'accepted', 'done'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Бүгд' : STATUS_LABEL[f as Booking['status']]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bookings */}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>Захиалга байхгүй</Text>
        ) : (
          filtered.map((b) => (
            <View key={b.id} style={styles.booking}>
              <View style={styles.bookingHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingClient}>{b.client}</Text>
                  <Text style={styles.bookingService}>{b.service}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[b.status] }]}>
                  <Text style={styles.statusText}>{STATUS_LABEL[b.status]}</Text>
                </View>
              </View>

              <View style={styles.bookingMeta}>
                <Text style={styles.bookingMetaText}>📅 {b.date} {b.time}</Text>
                <Text style={styles.bookingMetaText}>📍 {b.location}</Text>
                {b.price ? <Text style={styles.bookingMetaText}>💰 {b.price}</Text> : null}
              </View>

              <View style={styles.bookingActions}>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => Linking.openURL(`tel:${b.phone}`)}
                >
                  <Text style={styles.miniBtnText}>📞 Залгах</Text>
                </TouchableOpacity>
                {b.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: AppColors.accent }]}
                      onPress={() => updateStatus(b.id, 'accepted')}
                    >
                      <Text style={[styles.miniBtnText, { color: AppColors.white }]}>✓ Хүлээн авах</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: AppColors.grayLight }]}
                      onPress={() => updateStatus(b.id, 'cancelled')}
                    >
                      <Text style={styles.miniBtnText}>✗ Татгалзах</Text>
                    </TouchableOpacity>
                  </>
                )}
                {b.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: AppColors.success }]}
                    onPress={() => updateStatus(b.id, 'done')}
                  >
                    <Text style={[styles.miniBtnText, { color: AppColors.white }]}>✓ Дууссан</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Settings/profile btn */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('Тохиргоо', 'Үйлчилгээний хаяг/үнэ Phase 2-д')}
      >
        <Text style={styles.fabText}>⚙ Үйлчилгээний тохиргоо</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Stat({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  body: { padding: 16, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: '800', color: AppColors.black, marginTop: 4 },
  statLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
  },
  filterChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  filterText: { fontSize: 13, color: AppColors.black, fontWeight: '600' },
  filterTextActive: { color: AppColors.white },
  empty: { textAlign: 'center', color: AppColors.gray, marginTop: 30 },
  booking: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  bookingHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingClient: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  bookingService: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  bookingMeta: { marginTop: 10, gap: 3 },
  bookingMetaText: { fontSize: 12, color: AppColors.grayDark },
  bookingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: AppColors.grayLight,
  },
  miniBtnText: { fontSize: 12, fontWeight: '700', color: AppColors.black },
  fab: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: AppColors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
});
