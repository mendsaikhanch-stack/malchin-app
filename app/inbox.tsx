import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

type Category = 'alert' | 'sum' | 'bag' | 'coop' | 'event' | 'system';
type Severity = 'low' | 'medium' | 'high';

type Notification = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  body: string;
  from: string;
  date: string;
  read: boolean;
  requireAck?: boolean;
  acknowledged?: boolean;
  link?: { label: string; route: string };
};

const MOCK: Notification[] = [
  {
    id: '1', category: 'alert', severity: 'high',
    title: 'Зудын өндөр эрсдэл',
    body: 'ОБЕГ-ээс 4-р сарын 22-28 өдрүүдэд Төв аймгийн баруун хэсэгт цасан шуурга, -25°С-аас бага хүйтрэх сэрэмжлүүлэг.',
    from: 'ОБЕГ — Сэрэмжлүүлэг', date: '2026-04-22 08:00', read: false, requireAck: true,
  },
  {
    id: '2', category: 'sum', severity: 'medium',
    title: 'Мал тооллого — 3-р баг',
    body: '4-р сарын 25-28-нд 3-р багт мал тоолох ажил явна. Бүх өрх заавал оролцоно уу.',
    from: 'Алтанбулаг сумын ЗДТГ', date: '2026-04-22 10:30', read: false, requireAck: true,
  },
  {
    id: '3', category: 'bag', severity: 'low',
    title: 'Багийн хурал',
    body: 'Өнөөдөр 17:00 цагт багийн төвд хурал болно. Боломжтой хүмүүс ирнэ үү.',
    from: 'Дорж.Т (баг дарга)', date: '2026-04-22 09:15', read: true,
  },
  {
    id: '4', category: 'event', severity: 'medium',
    title: 'Вакцинжуулалт — ирэх 7 хоногт',
    body: '5-р сарын 10-аас эхлэн шүлхий, галзуугийн вакцинжуулалт. Хуваарь: 3 баг 10-15, 1 баг 16-21.',
    from: 'Мал эмнэлэг', date: '2026-04-21 14:00', read: true,
  },
  {
    id: '5', category: 'coop', severity: 'low',
    title: 'Ноолуурын үнэ өссөн',
    body: 'A зэрэглэлийн ноолуур 80,000→95,000₮/кг. Захиалгаа нэгтгэнэ үү.',
    from: 'Ноолуурын хоршоо', date: '2026-04-20 12:00', read: false,
  },
  {
    id: '6', category: 'system', severity: 'low',
    title: 'Бүртгэл амжилттай',
    body: 'Малчин апп руу тавтай морил. Нүүр дэлгэцэнд 7 өдрийн цаг агаар, сэрэмжлүүлэг, зөвлөгөө харагдана.',
    from: 'Систем', date: '2026-04-18 08:00', read: true,
  },
];

const CAT_EMOJI: Record<Category, string> = {
  alert: '🚨', sum: '🏛️', bag: '👥', coop: '🤝', event: '📅', system: '⚙️',
};
const CAT_LABEL: Record<Category, string> = {
  alert: 'Сэрэмжлүүлэг', sum: 'Сум', bag: 'Баг', coop: 'Хоршоо', event: 'Арга хэмжээ', system: 'Систем',
};
const SEV_COLOR: Record<Severity, string> = {
  high: AppColors.danger, medium: AppColors.warning, low: AppColors.grayDark,
};

export default function Inbox() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>(MOCK);
  const [filter, setFilter] = useState<Category | 'all' | 'unread'>('all');
  const [detail, setDetail] = useState<Notification | null>(null);

  const filtered = items.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.category === filter;
  });

  const unreadCount = items.filter((n) => !n.read).length;
  const unackCount = items.filter((n) => n.requireAck && !n.acknowledged).length;

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const ack = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, acknowledged: true, read: true } : n)));
    if (detail?.id === id) setDetail({ ...detail, acknowledged: true, read: true });
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const openDetail = (n: Notification) => {
    markRead(n.id);
    setDetail(n);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Мэдэгдэл</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} уншаагүй` : 'Бүгд уншсан'}
            {unackCount > 0 ? ` · ${unackCount} баталгаажуулаагүй` : ''}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Бүгдийг уншсан</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filter}>
        <Chip label="Бүгд" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`Уншаагүй (${unreadCount})`} active={filter === 'unread'} onPress={() => setFilter('unread')} />
        {(['alert', 'sum', 'bag', 'coop', 'event'] as Category[]).map((c) => (
          <Chip
            key={c}
            label={`${CAT_EMOJI[c]} ${CAT_LABEL[c]}`}
            active={filter === c}
            onPress={() => setFilter(c)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Шинэ мэдэгдэл алга</Text>
          </View>
        ) : (
          filtered.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.item, !n.read && styles.itemUnread]}
              onPress={() => openDetail(n)}
            >
              <View style={[styles.sevLine, { backgroundColor: SEV_COLOR[n.severity] }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.itemHead}>
                  <Text style={styles.itemEmoji}>{CAT_EMOJI[n.category]}</Text>
                  <Text style={styles.itemCategory}>{CAT_LABEL[n.category]}</Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={[styles.itemTitle, !n.read && styles.itemTitleUnread]}>{n.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>{n.body}</Text>
                <View style={styles.itemFoot}>
                  <Text style={styles.itemFrom}>✍️ {n.from}</Text>
                  <Text style={styles.itemDate}>{n.date.split(' ')[1]}</Text>
                </View>
                {n.requireAck && !n.acknowledged && (
                  <View style={styles.ackBanner}>
                    <Text style={styles.ackText}>⚠ Баталгаажуулалт шаардана</Text>
                  </View>
                )}
                {n.acknowledged && (
                  <View style={styles.ackedBanner}>
                    <Text style={styles.ackedText}>✓ Баталгаажуулсан</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!detail} animationType="slide" transparent>
        {detail && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.detailHead}>
                  <View style={[styles.catBadge, { backgroundColor: SEV_COLOR[detail.severity] }]}>
                    <Text style={styles.catBadgeText}>
                      {CAT_EMOJI[detail.category]} {CAT_LABEL[detail.category]}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetail(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailTitle}>{detail.title}</Text>
                <Text style={styles.detailMeta}>✍️ {detail.from}</Text>
                <Text style={styles.detailMeta}>📅 {detail.date}</Text>

                <Text style={styles.detailBody}>{detail.body}</Text>

                {detail.requireAck && !detail.acknowledged && (
                  <TouchableOpacity
                    style={styles.ackBtn}
                    onPress={() => ack(detail.id)}
                  >
                    <Text style={styles.ackBtnText}>✓ Уншсан, ойлголоо</Text>
                  </TouchableOpacity>
                )}
                {detail.acknowledged && (
                  <View style={styles.ackedBig}>
                    <Text style={styles.ackedBigText}>✓ Баталгаажуулсан</Text>
                  </View>
                )}

                {detail.link && (
                  <TouchableOpacity
                    style={styles.linkBtn}
                    onPress={() => {
                      setDetail(null);
                      router.push(detail.link!.route as any);
                    }}
                  >
                    <Text style={styles.linkBtnText}>{detail.link.label} ›</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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
  markAllText: { fontSize: 13, color: AppColors.primary, fontWeight: '700' },
  filter: { padding: 12, gap: 8, backgroundColor: AppColors.white },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, color: AppColors.black, fontWeight: '600' },
  chipTextActive: { color: AppColors.white },
  body: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: 14, color: AppColors.grayDark, marginTop: 14 },
  item: {
    flexDirection: 'row',
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 8,
    gap: 10, overflow: 'hidden',
  },
  itemUnread: { backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#C6F6D5' },
  sevLine: { width: 3, borderRadius: 2 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemEmoji: { fontSize: 16 },
  itemCategory: { fontSize: 11, color: AppColors.grayDark, fontWeight: '700', textTransform: 'uppercase' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.primary, marginLeft: 'auto' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black, marginTop: 4 },
  itemTitleUnread: { fontWeight: '800' },
  itemBody: { fontSize: 13, color: AppColors.grayDark, marginTop: 4, lineHeight: 18 },
  itemFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  itemFrom: { fontSize: 11, color: AppColors.grayDark },
  itemDate: { fontSize: 11, color: AppColors.gray },
  ackBanner: {
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: '#FFEBEE', alignSelf: 'flex-start',
  },
  ackText: { fontSize: 11, color: AppColors.danger, fontWeight: '700' },
  ackedBanner: {
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: '#E8F5E9', alignSelf: 'flex-start',
  },
  ackedText: { fontSize: 11, color: AppColors.success, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  catBadgeText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  closeBtn: { fontSize: 22, color: AppColors.grayDark, fontWeight: '700' },
  detailTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginTop: 14 },
  detailMeta: { fontSize: 12, color: AppColors.grayDark, marginTop: 6 },
  detailBody: { fontSize: 15, color: AppColors.black, lineHeight: 24, marginTop: 14 },
  ackBtn: {
    marginTop: 20, paddingVertical: 14, borderRadius: 10, backgroundColor: AppColors.primary, alignItems: 'center',
  },
  ackBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  ackedBig: {
    marginTop: 20, paddingVertical: 14, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center',
  },
  ackedBigText: { color: AppColors.success, fontSize: 15, fontWeight: '700' },
  linkBtn: {
    marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: AppColors.grayLight, alignItems: 'center',
  },
  linkBtnText: { color: AppColors.primary, fontSize: 14, fontWeight: '700' },
});
