import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { useElderFlag } from '@/hooks/use-elder-flag';

type ContentType = 'text' | 'audio' | 'video' | 'card';
type Status = 'draft' | 'review' | 'published' | 'archived';

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn' | 'any';
  species: string[];
  topic: string;
  status: Status;
  submittedAt: string;
  reviewerNote?: string;
};

const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: 'text',
    title: 'Хаврын цасны хайлгалтыг шинжих',
    body: 'Хаврын нар жигдрэхэд цас хайлгалт өглөө оройн зөрүү ихсэхийг анхаарна...',
    season: 'spring',
    species: ['all'],
    topic: 'traditional',
    status: 'published',
    submittedAt: '2026-03-15',
  },
  {
    id: '2',
    type: 'audio',
    title: 'Ямаа угаах цаг, арга',
    body: '3 минутын аудио — Хэзээ угаах вэ? Ямар жороор?',
    season: 'spring',
    species: ['goat'],
    topic: 'care',
    status: 'review',
    submittedAt: '2026-04-20',
  },
  {
    id: '3',
    type: 'text',
    title: 'Сул малыг тордох тухай',
    body: 'Судал сул малыг өвлийн сүүл хаврын эхний тордолт...',
    season: 'winter',
    species: ['sheep', 'goat'],
    topic: 'health',
    status: 'draft',
    submittedAt: '2026-04-22',
  },
];

const TYPE_EMOJI: Record<ContentType, string> = {
  text: '📝', audio: '🎙️', video: '🎥', card: '🖼️',
};
const TYPE_LABEL: Record<ContentType, string> = {
  text: 'Бичвэр', audio: 'Аудио', video: 'Видео', card: 'Зурагтай карт',
};

const STATUS_COLOR: Record<Status, string> = {
  draft: AppColors.gray,
  review: AppColors.warning,
  published: AppColors.success,
  archived: AppColors.grayDark,
};
const STATUS_LABEL: Record<Status, string> = {
  draft: 'Ноорог',
  review: 'Хянагдаж байна',
  published: 'Нийтэлсэн',
  archived: 'Архивд',
};

const SEASONS = [
  { id: 'any', label: 'Бүх улирал' },
  { id: 'winter', label: 'Өвөл' },
  { id: 'spring', label: 'Хавар' },
  { id: 'summer', label: 'Зун' },
  { id: 'autumn', label: 'Намар' },
];

const SPECIES = [
  { id: 'all', label: 'Бүх төрөл' },
  { id: 'horse', label: 'Адуу' },
  { id: 'cow', label: 'Үхэр' },
  { id: 'sheep', label: 'Хонь' },
  { id: 'goat', label: 'Ямаа' },
  { id: 'camel', label: 'Тэмээ' },
];

export default function ElderContent() {
  const router = useRouter();
  const { enabled, loading: flagLoading, toggle } = useElderFlag();
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<ContentItem>>({
    type: 'text',
    season: 'any',
    species: ['all'],
    topic: 'traditional',
  });
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);

  // Flag loading
  if (flagLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.optIn}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // elder_contributor flag-гүй үед opt-in screen
  if (!enabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ахмадын ухаан</Text>
            <Text style={styles.headerSubtitle}>Контент бүтээгчийн capability</Text>
          </View>
        </View>
        <View style={styles.optIn}>
          <Text style={styles.optInEmoji}>👴</Text>
          <Text style={styles.optInTitle}>Ахмад/контент бүтээгч</Text>
          <Text style={styles.optInText}>
            Та ахмадын туршлага, малчдын ухааныг бусадтай хуваалцах хүсэлтэй
            бол энэ capability-г идэвхжүүлнэ. Role-ээ солих шаардлагагүй —
            одоогийн профайлтайгаа хамт идэвхжинэ. Хэзээ ч унтраах боломжтой.
          </Text>
          <Text style={styles.optInPipeline}>
            Пайплайн: Ноорог → Хянаж байна → Нийтлэгдсэн (1–3 хоногт)
          </Text>
          <TouchableOpacity
            style={styles.optInBtn}
            onPress={() => toggle(true)}
          >
            <Text style={styles.optInBtnText}>Идэвхжүүлэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const submitNew = () => {
    if (!form.title || !form.body) {
      Alert.alert('Алдаа', 'Гарчиг болон агуулгаа бичнэ үү');
      return;
    }
    const next: ContentItem = {
      id: Date.now().toString(),
      type: form.type || 'text',
      title: form.title,
      body: form.body,
      season: form.season || 'any',
      species: form.species || ['all'],
      topic: form.topic || 'traditional',
      status: 'review',
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setContent([next, ...content]);
    setModalVisible(false);
    setForm({ type: 'text', season: 'any', species: ['all'], topic: 'traditional' });
    Alert.alert(
      'Хүлээн авлаа',
      'Контентыг редактор 1-3 хоногт хянаж нийтлэх эсвэл санал ирүүлнэ.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ахмадын ухаан</Text>
          <Text style={styles.headerSubtitle}>Миний оруулсан контент</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Баталгаажсан</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatBox label="Нийтэлсэн" value={content.filter((c) => c.status === 'published').length} color={AppColors.success} />
        <StatBox label="Хянагдаж" value={content.filter((c) => c.status === 'review').length} color={AppColors.warning} />
        <StatBox label="Ноорог" value={content.filter((c) => c.status === 'draft').length} color={AppColors.gray} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {content.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.item}
            onPress={() => setDetailItem(c)}
          >
            <View style={styles.itemHead}>
              <Text style={styles.itemEmoji}>{TYPE_EMOJI[c.type]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{c.title}</Text>
                <Text style={styles.itemMeta}>
                  {TYPE_LABEL[c.type]} · {SEASONS.find((s) => s.id === c.season)?.label} · {c.submittedAt}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[c.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[c.status]}</Text>
              </View>
            </View>
            <Text style={styles.itemBody} numberOfLines={2}>
              {c.body}
            </Text>
            {c.reviewerNote && (
              <View style={styles.reviewNote}>
                <Text style={styles.reviewLabel}>📝 Редакторын санал:</Text>
                <Text style={styles.reviewText}>{c.reviewerNote}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Capability унтраах — Ноорог хэвээр үлдэнэ, зөвхөн access алдагдана */}
        <TouchableOpacity
          style={styles.disableBtn}
          onPress={() =>
            Alert.alert(
              'Capability-г унтраах',
              'Ахмад/контент бүтээгч capability-г унтраах уу? Ноорог + нийтэлсэн контент хэвээр үлдэнэ, зөвхөн энэ дэлгэцийн хандалт хаагдана. Хэзээ ч дахин идэвхжүүлэх боломжтой.',
              [
                { text: 'Болих', style: 'cancel' },
                {
                  text: 'Унтраах',
                  style: 'destructive',
                  onPress: () => toggle(false),
                },
              ]
            )
          }
        >
          <Text style={styles.disableBtnText}>Capability-г унтраах</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Шинэ контент</Text>
      </TouchableOpacity>

      {/* Upload modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Шинэ контент оруулах</Text>

              {/* Type */}
              <Text style={styles.label}>Төрөл</Text>
              <View style={styles.chipRow}>
                {(['text', 'audio', 'video', 'card'] as ContentType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, form.type === t && styles.chipActive]}
                    onPress={() => setForm({ ...form, type: t })}
                  >
                    <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>
                      {TYPE_EMOJI[t]} {TYPE_LABEL[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {(form.type === 'audio' || form.type === 'video') && (
                <Text style={styles.note}>
                  💡 Аудио/видео бичлэг оруулах функц Phase 2-д нэмэгдэнэ. Одоогоор тайлбар бичээрэй.
                </Text>
              )}

              {/* Title */}
              <Text style={styles.label}>Гарчиг *</Text>
              <TextInput
                style={styles.input}
                value={form.title || ''}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="Жишээ: Зудын бэлтгэл 3 алхам"
              />

              {/* Body */}
              <Text style={styles.label}>Агуулга *</Text>
              <TextInput
                style={[styles.input, { height: 150 }]}
                multiline
                value={form.body || ''}
                onChangeText={(v) => setForm({ ...form, body: v })}
                placeholder="Туршлага, арга, жор..."
              />

              {/* Season */}
              <Text style={styles.label}>Улирал</Text>
              <View style={styles.chipRow}>
                {SEASONS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, form.season === s.id && styles.chipActive]}
                    onPress={() => setForm({ ...form, season: s.id as any })}
                  >
                    <Text style={[styles.chipText, form.season === s.id && styles.chipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Species */}
              <Text style={styles.label}>Мал төрөл</Text>
              <View style={styles.chipRow}>
                {SPECIES.map((sp) => {
                  const selected = form.species?.includes(sp.id);
                  return (
                    <TouchableOpacity
                      key={sp.id}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => {
                        const cur = form.species || [];
                        setForm({
                          ...form,
                          species: selected ? cur.filter((x) => x !== sp.id) : [...cur, sp.id],
                        });
                      }}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {sp.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.infoTitle}>📋 Публикацын урсгал</Text>
                <Text style={styles.infoText}>
                  1. Хянах (1-3 хоног) → 2. Санал / засварт буцах → 3. Батлагдах → 4. Нийтлэгдэх
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Цуцлах</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.submitBtn]}
                  onPress={submitNew}
                >
                  <Text style={styles.submitText}>Илгээх</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!detailItem} animationType="slide" transparent>
        {detailItem && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>
                  {TYPE_EMOJI[detailItem.type]} {detailItem.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[detailItem.status], alignSelf: 'flex-start', marginTop: 8 }]}>
                  <Text style={styles.statusText}>{STATUS_LABEL[detailItem.status]}</Text>
                </View>

                <Text style={styles.detailSection}>📅 Улирал: {SEASONS.find((s) => s.id === detailItem.season)?.label}</Text>
                <Text style={styles.detailSection}>🐑 Төрөл: {detailItem.species.map((s) => SPECIES.find((x) => x.id === s)?.label).filter(Boolean).join(', ')}</Text>
                <Text style={styles.detailSection}>📆 Оруулсан: {detailItem.submittedAt}</Text>

                <Text style={styles.detailBody}>{detailItem.body}</Text>

                {detailItem.reviewerNote && (
                  <View style={styles.reviewNote}>
                    <Text style={styles.reviewLabel}>📝 Редакторын санал:</Text>
                    <Text style={styles.reviewText}>{detailItem.reviewerNote}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn, { marginTop: 20 }]}
                  onPress={() => setDetailItem(null)}
                >
                  <Text style={styles.cancelText}>Хаах</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.grayLight,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  optIn: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  optInEmoji: { fontSize: 64 },
  optInTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.black,
    textAlign: 'center',
  },
  optInText: {
    fontSize: 14,
    color: AppColors.grayDark,
    textAlign: 'center',
    lineHeight: 22,
  },
  optInPipeline: {
    fontSize: 12,
    color: AppColors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  optInBtn: {
    marginTop: 12,
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  optInBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  disableBtn: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  disableBtnText: {
    fontSize: 13,
    color: AppColors.grayDark,
    fontWeight: '600',
  },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: AppColors.success },
  verifiedText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: AppColors.white },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  list: { padding: 16 },
  item: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemEmoji: { fontSize: 28 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  itemMeta: { fontSize: 11, color: AppColors.grayDark, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: AppColors.white, fontSize: 10, fontWeight: '700' },
  itemBody: { fontSize: 13, color: AppColors.grayDark, marginTop: 10, lineHeight: 18 },
  reviewNote: {
    marginTop: 10, padding: 10, backgroundColor: '#FFFBEA', borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  reviewLabel: { fontSize: 12, fontWeight: '700', color: AppColors.grayDark },
  reviewText: { fontSize: 12, color: AppColors.grayDark, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: AppColors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 10 },
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
  note: {
    marginTop: 8, padding: 10, backgroundColor: '#FFFBEA', borderRadius: 8,
    fontSize: 12, color: AppColors.grayDark,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  info: {
    marginTop: 16, padding: 12, backgroundColor: '#F0FFF4', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: AppColors.primary,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  infoText: { fontSize: 12, color: AppColors.grayDark, marginTop: 4, lineHeight: 18 },
  detailSection: { fontSize: 12, color: AppColors.grayDark, marginTop: 6 },
  detailBody: { fontSize: 14, color: AppColors.black, marginTop: 14, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: AppColors.grayLight },
  cancelText: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  submitBtn: { backgroundColor: AppColors.primary },
  submitText: { fontSize: 14, fontWeight: '700', color: AppColors.white },
});
