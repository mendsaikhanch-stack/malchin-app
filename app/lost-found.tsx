import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { ReportButton } from '@/components/report-button';
import { lostFoundApi } from '@/services/api';
import { queueOnFailure } from '@/services/sync-queue';
import {
  fetchLostFoundListings,
  validateListing,
  buildListing,
  findPotentialMatches,
  countActive,
  filterByType,
  sortByDateDesc,
  type Listing,
  type ListingType } from '@/services/lost-found-data';

const SPECIES = [
  { id: 'horse', label: 'Адуу', emoji: '🐎' },
  { id: 'cow', label: 'Үхэр', emoji: '🐂' },
  { id: 'sheep', label: 'Хонь', emoji: '🐑' },
  { id: 'goat', label: 'Ямаа', emoji: '🐐' },
  { id: 'camel', label: 'Тэмээ', emoji: '🐪' },
];

const COLORS = [
  'Хээр', 'Зээрд', 'Хул', 'Цагаан', 'Хар', 'Бор', 'Алаг', 'Шар',
];

// Listing data нь services/lost-found-data.ts — fetchLostFoundListings()
// (одоогоор mock, backend endpoint бэлэн болмогц 1 газар солино).

export default function LostFoundScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ListingType>('lost');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>({
    type: 'lost',
    species: 'horse',
    color: 'Хээр' });
  const [detailModal, setDetailModal] = useState<Listing | null>(null);

  useEffect(() => {
    fetchLostFoundListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => sortByDateDesc(filterByType(listings, tab)),
    [listings, tab]
  );

  // Detail modal-д боломжит тохиролцоо (lost ↔ found)
  const potentialMatches = useMemo(() => {
    if (!detailModal) return [];
    return findPotentialMatches(detailModal, listings, 0.5).slice(0, 3);
  }, [detailModal, listings]);

  const openForm = (type: ListingType) => {
    setForm({ type, species: 'horse', color: 'Хээр', count: 1 });
    setModalVisible(true);
  };

  const submitForm = async () => {
    const result = validateListing(form);
    if (!result.ok) {
      Alert.alert('Алдаа', result.errors.map((e) => e.message).join('\n'));
      return;
    }
    const next = buildListing({
      type: form.type || 'lost',
      species: form.species!,
      count: form.count || 1,
      color: form.color || '',
      age: form.age || '',
      brand: form.brand || '',
      earTag: form.earTag || '',
      lastSeen: form.lastSeen!,
      phone: form.phone!,
      reward: form.reward });
    // Optimistic UI — сүлжээгүй үед queue-д орно, reconnect үед autoSync flush.
    setListings([next, ...listings]);
    setModalVisible(false);
    const { id: _omit, status: _omit2, ...payload } = next;
    const queued = await queueOnFailure(
      () => lostFoundApi.create(payload),
      { table_name: 'lost_found', action: 'INSERT', record_id: 0, data: payload }
    );
    Alert.alert(
      queued.synced ? 'Амжилттай' : 'Локал хадгалагдлаа',
      queued.synced
        ? 'Зарлал илгээгдлээ. Багийн даргын баталгаажуулалтын дараа нийтлэгдэнэ.'
        : 'Сүлжээнд холбогдох үед автоматаар илгээгдэнэ.'
    );
  };

  const speciesOf = (id: string) =>
    SPECIES.find((s) => s.id === id) || { emoji: '🐾', label: id };

  const markResolved = (id: string) => {
    Alert.alert('Баталгаажуулах', 'Эзэнд хүрсэн гэж тэмдэглэх үү?', [
      { text: 'Үгүй', style: 'cancel' },
      {
        text: 'Тийм',
        onPress: async () => {
          setListings((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status: 'resolved' } : l))
          );
          setDetailModal(null);
          await queueOnFailure(
            () => lostFoundApi.resolve(id),
            { table_name: 'lost_found', action: 'UPDATE', record_id: 0, data: { id, status: 'resolved' } }
          );
        } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Алдсан / Олдсон мал</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'lost' && styles.tabActive]}
          onPress={() => setTab('lost')}
        >
          <Text style={[styles.tabText, tab === 'lost' && styles.tabTextActive]}>
            🔍 Алдсан ({countActive(listings, 'lost')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'found' && styles.tabActive]}
          onPress={() => setTab('found')}
        >
          <Text style={[styles.tabText, tab === 'found' && styles.tabTextActive]}>
            ✅ Олдсон ({countActive(listings, 'found')})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={AppColors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Одоогоор зарлал байхгүй</Text>
        ) : (
          filtered.map((l) => {
            const sp = speciesOf(l.species);
            return (
              <TouchableOpacity
                key={l.id}
                style={[styles.card, l.status === 'resolved' && styles.cardResolved]}
                onPress={() => setDetailModal(l)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{sp.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {l.count} {sp.label} — {l.color}
                    </Text>
                    <Text style={styles.cardLocation}>📍 {l.lastSeen}</Text>
                    <Text style={styles.cardDate}>{l.date}</Text>
                  </View>
                  {l.reward ? (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>🎁</Text>
                    </View>
                  ) : null}
                </View>
                {l.status === 'resolved' && (
                  <Text style={styles.resolvedBadge}>✓ Эзэнд хүрсэн</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openForm(tab)}>
        <Text style={styles.fabText}>
          + {tab === 'lost' ? 'Алдсан' : 'Олдсон'} мал зарлах
        </Text>
      </TouchableOpacity>

      {/* Form modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {form.type === 'lost' ? 'Алдсан' : 'Олдсон'} мал зарлах
              </Text>

              {/* Species */}
              <Text style={styles.label}>Төрөл *</Text>
              <View style={styles.chipRow}>
                {SPECIES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, form.species === s.id && styles.chipActive]}
                    onPress={() => setForm({ ...form, species: s.id })}
                  >
                    <Text style={styles.chipText}>
                      {s.emoji} {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Count */}
              <Text style={styles.label}>Тоо *</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(form.count || '')}
                onChangeText={(v) => setForm({ ...form, count: Number(v) || 0 })}
                placeholder="Жишээ: 2"
              />

              {/* Color */}
              <Text style={styles.label}>Зүс</Text>
              <View style={styles.chipRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, form.color === c && styles.chipActive]}
                    onPress={() => setForm({ ...form, color: c })}
                  >
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Нас</Text>
              <TextInput
                style={styles.input}
                value={form.age || ''}
                onChangeText={(v) => setForm({ ...form, age: v })}
                placeholder="Жишээ: 5-7 настай"
              />

              <Text style={styles.label}>Тамга</Text>
              <TextInput
                style={styles.input}
                value={form.brand || ''}
                onChangeText={(v) => setForm({ ...form, brand: v })}
                placeholder="Жишээ: Зүүн гуянд 'Х'"
              />

              <Text style={styles.label}>Чихний дугаар</Text>
              <TextInput
                style={styles.input}
                value={form.earTag || ''}
                onChangeText={(v) => setForm({ ...form, earTag: v })}
                placeholder="MN-xxxxx"
              />

              <Text style={styles.label}>Сүүлд үзсэн газар *</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                multiline
                value={form.lastSeen || ''}
                onChangeText={(v) => setForm({ ...form, lastSeen: v })}
                placeholder="Аймаг, сум, баг, тодорхой газар..."
              />

              <Text style={styles.label}>Утас *</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={form.phone || ''}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                placeholder="99112233"
              />

              {form.type === 'lost' && (
                <>
                  <Text style={styles.label}>Шагнал</Text>
                  <TextInput
                    style={styles.input}
                    value={form.reward || ''}
                    onChangeText={(v) => setForm({ ...form, reward: v })}
                    placeholder="Жишээ: 100,000₮ эсвэл Хэлэлцье"
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnSecondaryText}>Цуцлах</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={submitForm}
                >
                  <Text style={styles.btnPrimaryText}>Илгээх</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!detailModal} animationType="slide" transparent>
        {detailModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>
                  {speciesOf(detailModal.species).emoji} {detailModal.count}{' '}
                  {speciesOf(detailModal.species).label}
                </Text>
                <Detail k="Зүс" v={detailModal.color} />
                <Detail k="Нас" v={detailModal.age} />
                <Detail k="Тамга" v={detailModal.brand} />
                {detailModal.earTag ? <Detail k="Чихний дугаар" v={detailModal.earTag} /> : null}
                <Detail k="Байршил" v={detailModal.lastSeen} />
                <Detail k="Огноо" v={detailModal.date} />
                <Detail k="Утас" v={detailModal.phone} />
                {detailModal.reward ? <Detail k="Шагнал" v={detailModal.reward} /> : null}

                {/* Боломжит тохироо (lost↔found) */}
                {potentialMatches.length > 0 && (
                  <View style={styles.matchBox}>
                    <Text style={styles.matchTitle}>
                      🎯 Боломжит тохироо ({potentialMatches.length})
                    </Text>
                    {potentialMatches.map((m) => {
                      const sp = speciesOf(m.listing.species);
                      const pct = Math.round(m.score * 100);
                      return (
                        <TouchableOpacity
                          key={m.listing.id}
                          style={styles.matchRow}
                          onPress={() => setDetailModal(m.listing)}
                        >
                          <Text style={styles.matchEmoji}>{sp.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.matchHeader}>
                              {m.listing.type === 'lost' ? 'Алдсан' : 'Олдсон'} · {m.listing.count} {sp.label}
                            </Text>
                            <Text style={styles.matchLoc} numberOfLines={1}>
                              📍 {m.listing.lastSeen}
                            </Text>
                          </View>
                          <View style={[
                            styles.matchBadge,
                            pct >= 80 && { backgroundColor: AppColors.success },
                            pct >= 60 && pct < 80 && { backgroundColor: AppColors.warning },
                          ]}>
                            <Text style={styles.matchPct}>{pct}%</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={() => setDetailModal(null)}
                  >
                    <Text style={styles.btnSecondaryText}>Хаах</Text>
                  </TouchableOpacity>
                  {detailModal.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={() => markResolved(detailModal.id)}
                    >
                      <Text style={styles.btnPrimaryText}>Эзэнд хүрсэн</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ marginTop: 14 }}>
                  <ReportButton listingId={detailModal.id} kind="lost_found" />
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{k}</Text>
      <Text style={styles.detailValue}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  tabs: {
    flexDirection: 'row', backgroundColor: AppColors.white,
    paddingHorizontal: 16, paddingBottom: 10 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: AppColors.primary },
  tabText: { fontSize: 14, color: AppColors.grayDark, fontWeight: '600' },
  tabTextActive: { color: AppColors.primary },
  list: { padding: 16 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',  
      elevation: 2 },
  cardResolved: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  cardLocation: { fontSize: 13, color: AppColors.grayDark, marginTop: 4 },
  cardDate: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
  rewardBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center' },
  rewardText: { fontSize: 18 },
  resolvedBadge: {
    marginTop: 8, fontSize: 12, fontWeight: '700', color: AppColors.success },
  empty: { textAlign: 'center', color: AppColors.gray, marginTop: 40 },
  fab: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: AppColors.primary, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', boxShadow: '0px 4px 8px rgba(0,0,0,0.2)', 
     elevation: 6 },
  fabText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%' },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: AppColors.grayMedium, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, color: AppColors.black },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.grayLight },
  btnPrimaryText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  btnSecondaryText: { color: AppColors.black, fontSize: 15, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: AppColors.grayLight },
  detailKey: { flex: 1, fontSize: 14, color: AppColors.grayDark },
  detailValue: { flex: 2, fontSize: 14, color: AppColors.black, fontWeight: '600' },
  matchBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6F6D5' },
  matchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.primaryDark,
    marginBottom: 10 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#D4E8D4' },
  matchEmoji: { fontSize: 24 },
  matchHeader: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  matchLoc: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: AppColors.gray },
  matchPct: { color: AppColors.white, fontSize: 12, fontWeight: '800' } });
