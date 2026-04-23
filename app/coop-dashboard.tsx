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

type Order = {
  id: string;
  member: string;
  product: string;
  qty: number;
  unit: string;
  price: number;
  status: 'new' | 'confirmed' | 'shipped' | 'paid';
  date: string;
};

const MOCK_ORDERS: Order[] = [
  { id: '1', member: 'Батбаяр.Б', product: 'Ямааны ноолуур', qty: 12, unit: 'кг', price: 85000, status: 'new', date: '2026-04-22' },
  { id: '2', member: 'Оюунтуяа.Д', product: 'Ямааны ноолуур', qty: 8, unit: 'кг', price: 85000, status: 'confirmed', date: '2026-04-21' },
  { id: '3', member: 'Дорж.Т', product: 'Хонины ноос', qty: 25, unit: 'кг', price: 4500, status: 'shipped', date: '2026-04-20' },
  { id: '4', member: 'Насанбат.Ц', product: 'Ямааны ноолуур', qty: 15, unit: 'кг', price: 85000, status: 'paid', date: '2026-04-18' },
];

const STATUS_COLOR: Record<Order['status'], string> = {
  new: AppColors.warning,
  confirmed: AppColors.accent,
  shipped: '#9C27B0',
  paid: AppColors.success,
};
const STATUS_LABEL: Record<Order['status'], string> = {
  new: 'Шинэ',
  confirmed: 'Батласан',
  shipped: 'Тээвэрт',
  paid: 'Төлсөн',
};

export default function CoopDashboard() {
  const router = useRouter();
  const [priceModal, setPriceModal] = useState(false);
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');

  const newOrders = MOCK_ORDERS.filter((o) => o.status === 'new').length;
  const totalKg = MOCK_ORDERS.reduce((s, o) => s + o.qty, 0);
  const totalValue = MOCK_ORDERS.reduce((s, o) => s + o.qty * o.price, 0);
  const paidPct = Math.round(
    (MOCK_ORDERS.filter((o) => o.status === 'paid').length / MOCK_ORDERS.length) * 100
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Хоршооны самбар</Text>
          <Text style={styles.headerSubtitle}>Ноолуурын хоршоо · 120 гишүүн</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Тоо */}
        <View style={styles.statsRow}>
          <Stat label="Гишүүн" value="120" emoji="🤝" />
          <Stat label="Шинэ захиалга" value={String(newOrders)} emoji="📦" color={AppColors.warning} />
          <Stat label="Нийт кг" value={String(totalKg)} emoji="⚖️" />
          <Stat label="Төлсөн" value={`${paidPct}%`} emoji="💰" color={AppColors.success} />
        </View>

        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Энэ сарын нийт эргэлт</Text>
          <Text style={styles.valueAmount}>
            {totalValue.toLocaleString('mn-MN')}₮
          </Text>
        </View>

        {/* Үйлдэл */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.primary }]}
            onPress={() => setPriceModal(true)}
          >
            <Text style={styles.actionIcon}>📣</Text>
            <Text style={styles.actionText}>Үнэ зарлах</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.accent }]}
            onPress={() => Alert.alert('Тээвэр', 'Тээвэр захиалах (Phase 2)')}
          >
            <Text style={styles.actionIcon}>🚚</Text>
            <Text style={styles.actionText}>Тээвэр</Text>
          </TouchableOpacity>
        </View>

        {/* Захиалгын урсгал */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Захиалгын урсгал</Text>
          {MOCK_ORDERS.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderMember}>{o.member}</Text>
                <Text style={styles.orderProduct}>
                  {o.product} — {o.qty} {o.unit}
                </Text>
                <Text style={styles.orderPrice}>
                  {(o.qty * o.price).toLocaleString('mn-MN')}₮ · {o.date}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[o.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[o.status]}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Зах зээлийн үнэ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💹 Зах зээлийн үнэ (энэ өдөр)</Text>
          <PriceRow name="Ямааны ноолуур A" price="95,000₮/кг" trend="up" />
          <PriceRow name="Ямааны ноолуур B" price="80,000₮/кг" trend="flat" />
          <PriceRow name="Хонины ноос" price="4,500₮/кг" trend="down" />
          <PriceRow name="Тэмээний ноос" price="12,000₮/кг" trend="up" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Price broadcast modal */}
      <Modal visible={priceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Гишүүдэд үнэ зарлах</Text>
            <Text style={styles.modalHint}>120 гишүүнд push мэдэгдэл илгээнэ</Text>

            <Text style={styles.label}>Бүтээгдэхүүн</Text>
            <TextInput
              style={styles.input}
              value={product}
              onChangeText={setProduct}
              placeholder="Жишээ: Ямааны ноолуур A"
            />
            <Text style={styles.label}>Үнэ</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Жишээ: 95,000₮/кг"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => setPriceModal(false)}
              >
                <Text style={styles.btnSecondaryText}>Цуцлах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => {
                  if (!product || !price) {
                    Alert.alert('Алдаа', 'Талбарууд бөглөнө үү');
                    return;
                  }
                  Alert.alert('Илгээлээ', '120 гишүүнд мэдэгдэл очсон.');
                  setPriceModal(false);
                  setProduct('');
                  setPrice('');
                }}
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

function Stat({ label, value, emoji, color }: { label: string; value: string; emoji: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PriceRow({ name, price, trend }: { name: string; price: string; trend: 'up' | 'down' | 'flat' }) {
  const icon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  const color = trend === 'up' ? AppColors.success : trend === 'down' ? AppColors.danger : AppColors.grayDark;
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceName}>{name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[styles.priceValue, { color }]}>{price}</Text>
        <Text>{icon}</Text>
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
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 12, padding: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 16, fontWeight: '800', color: AppColors.black, marginTop: 4 },
  statLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  valueCard: {
    backgroundColor: AppColors.primary, borderRadius: 14, padding: 16, marginBottom: 12,
  },
  valueLabel: { fontSize: 12, color: '#E8F5E9' },
  valueAmount: { fontSize: 26, fontWeight: '800', color: AppColors.white, marginTop: 4 },
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
  orderRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight, gap: 10,
  },
  orderMember: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  orderProduct: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  orderPrice: { fontSize: 12, color: AppColors.primary, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  priceName: { fontSize: 13, color: AppColors.black },
  priceValue: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black },
  modalHint: { fontSize: 12, color: AppColors.grayDark, marginTop: 4 },
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
