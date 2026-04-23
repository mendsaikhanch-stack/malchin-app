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

type ContentType = 'text' | 'audio' | 'video' | 'card';
type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'any';
type Source = 'elder' | 'expert' | 'official';

type Item = {
  id: string;
  type: ContentType;
  source: Source;
  title: string;
  body: string;
  author: string;
  location?: string;
  season: Season;
  species: string[];
  date: string;
  views: number;
  saved?: boolean;
};

const MOCK: Item[] = [
  {
    id: '1', type: 'text', source: 'elder',
    title: 'Хаврын цасны хайлгалтыг шинжих',
    body: `Хаврын нар жигдрэхэд цас хайлгалт өглөө оройн зөрүү ихсэхийг анхаарна. Намрын сүүл цэргийн дэглэмд тогтсон цастай хавар гэдэг бол:

— Өглөө -8, өдөр +2 гэх мэт хугарах температур.
— Цас хайлж бутарч, нам газар шалбааг болно.
— Шалбаагт мал орж үсэрхэж болзошгүй.

Анхаарах зүйлс:
1. Бэлчээр урт нөмөг газар хайх
2. Нойтон бэлчээрт ямаа орохоос зайлсхийх
3. Хөлдсөн шээс, баас харагдаж болох — ариутгалтай холбоотой`,
    author: 'Ахмад Лувсан', location: 'Төв аймаг, Алтанбулаг',
    season: 'spring', species: ['all'],
    date: '2026-03-20', views: 458, saved: false,
  },
  {
    id: '2', type: 'audio', source: 'elder',
    title: 'Ямаа угаах цаг, арга',
    body: '3 минутын аудио — Ямаа хэзээ угаах вэ? Ямар жор ашиглах вэ? Уламжлалт ургамлын тос, шинэ заст хоёрын ялгаа.',
    author: 'Ахмад Сараа', location: 'Архангай',
    season: 'spring', species: ['goat'],
    date: '2026-04-02', views: 312,
  },
  {
    id: '3', type: 'text', source: 'expert',
    title: 'Сул малыг тордох мэргэжлийн зөвлөгөө',
    body: `Өвлийн сүүл хаврын эхэнд сул дорой мал тордох зөв арга:

Тодорхойлолт:
— Нуруу босч, яс цухуйсан
— Хорын нойр хог
— Ургамал иддэггүй

Арга:
1. Нэмэлт тэжээл (хивэг, өндөг)
2. Витамин А, D, E
3. Байр сэрүүн, чийггүй
4. 2 долоо хоног тусгаарлах`,
    author: 'Др. Баатар (мал эмч)', location: 'УБ',
    season: 'spring', species: ['sheep', 'goat'],
    date: '2026-03-15', views: 892,
  },
  {
    id: '4', type: 'text', source: 'official',
    title: 'Вакцинжуулалтын 2026 оны 5-р сарын хуваарь',
    body: `5-р сард явагдах вакцинжуулалтын хуваарь (сумын Засаг даргын тамгын газраас):

— Шүлхий: 5-р сарын 10-20
— Галзуу: 5-р сарын 15-25
— Энцефалит: 5-р сарын 20-31

Очих багууд:
3, 5 баг — 10-15
1, 2, 4 баг — 16-21`,
    author: 'Сумын ЗДТГ', location: 'Алтанбулаг сум',
    season: 'any', species: ['all'],
    date: '2026-04-20', views: 1240,
  },
  {
    id: '5', type: 'text', source: 'elder',
    title: 'Төл бойжилт — үүрэн хайр',
    body: `Төл бойжилтын эхний 3 цаг маш чухал. Үүрэн хайрын жинхэнэ утга:

— Эхний 1 цаг — түрүү сүү (колострум) заавал
— 3 цаг — удаа дараа 2-3 удаа хөхүүлэх
— 1 хоног — хөл зогсох, бүлээн
— 3 хоног — эх тэжээх чадвартай эсэх

Амьд төлөөс нь зөв эх баталгаатай.`,
    author: 'Ахмад Жаргал', location: 'Завхан аймаг',
    season: 'spring', species: ['sheep', 'goat'],
    date: '2026-04-15', views: 673,
  },
];

const SOURCE_BADGE: Record<Source, { label: string; color: string; emoji: string }> = {
  elder: { label: 'Ахмадын ухаан', color: AppColors.secondary, emoji: '👴' },
  expert: { label: 'Мэргэжилтэн', color: AppColors.accent, emoji: '🎓' },
  official: { label: 'Албан ёсны', color: AppColors.primary, emoji: '🏛️' },
};

const TYPE_EMOJI: Record<ContentType, string> = {
  text: '📝', audio: '🎙️', video: '🎥', card: '🖼️',
};

const SEASON_LABEL: Record<Season, string> = {
  any: 'Бүх улирал',
  winter: 'Өвөл',
  spring: 'Хавар',
  summer: 'Зун',
  autumn: 'Намар',
};

export default function WisdomFeed() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(MOCK);
  const [filter, setFilter] = useState<Source | 'all'>('all');
  const [detail, setDetail] = useState<Item | null>(null);

  const filtered = filter === 'all' ? items : items.filter((i) => i.source === filter);

  const toggleSave = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, saved: !it.saved } : it)));
    if (detail?.id === id) setDetail({ ...detail, saved: !detail.saved });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Малчны ухаан</Text>
          <Text style={styles.headerSubtitle}>Ахмад, мэргэжилтний зөвлөгөө</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filter}>
        <FilterChip label="Бүгд" active={filter === 'all'} onPress={() => setFilter('all')} />
        {(['elder', 'expert', 'official'] as Source[]).map((s) => (
          <FilterChip
            key={s}
            label={`${SOURCE_BADGE[s].emoji} ${SOURCE_BADGE[s].label}`}
            active={filter === s}
            onPress={() => setFilter(s)}
            color={SOURCE_BADGE[s].color}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body}>
        {filtered.map((it) => {
          const src = SOURCE_BADGE[it.source];
          return (
            <TouchableOpacity
              key={it.id}
              style={styles.card}
              onPress={() => setDetail(it)}
            >
              <View style={styles.cardHead}>
                <View style={[styles.srcBadge, { backgroundColor: src.color }]}>
                  <Text style={styles.srcText}>
                    {src.emoji} {src.label}
                  </Text>
                </View>
                <Text style={styles.typeEmoji}>{TYPE_EMOJI[it.type]}</Text>
              </View>

              <Text style={styles.cardTitle}>{it.title}</Text>
              <Text style={styles.cardBody} numberOfLines={3}>{it.body}</Text>

              <View style={styles.cardFoot}>
                <Text style={styles.metaText}>✍️ {it.author}</Text>
                <Text style={styles.metaText}>📅 {SEASON_LABEL[it.season]}</Text>
                <Text style={styles.metaText}>👁 {it.views}</Text>
                <TouchableOpacity onPress={() => toggleSave(it.id)}>
                  <Text style={styles.saveIcon}>{it.saved ? '🔖' : '📑'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!detail} animationType="slide" transparent>
        {detail && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.cardHead}>
                  <View style={[styles.srcBadge, { backgroundColor: SOURCE_BADGE[detail.source].color }]}>
                    <Text style={styles.srcText}>
                      {SOURCE_BADGE[detail.source].emoji} {SOURCE_BADGE[detail.source].label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetail(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailTitle}>{detail.title}</Text>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailMetaText}>✍️ {detail.author}</Text>
                  {detail.location && <Text style={styles.detailMetaText}>📍 {detail.location}</Text>}
                  <Text style={styles.detailMetaText}>📅 {detail.date}</Text>
                </View>

                {detail.type === 'audio' && (
                  <View style={styles.audioPlayer}>
                    <Text style={styles.audioPlayerText}>🎙️ Audio player (Phase 2)</Text>
                  </View>
                )}

                <Text style={styles.detailBody}>{detail.body}</Text>

                {detail.source === 'elder' && (
                  <View style={styles.note}>
                    <Text style={styles.noteText}>
                      💡 Энэ бол уламжлалт ажиглалт ба туршлага. Шийдвэр гаргахдаа албан ёсны сэрэмжлүүлэгтэй хосолж ашигла.
                    </Text>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, detail.saved && styles.actionBtnActive]}
                    onPress={() => toggleSave(detail.id)}
                  >
                    <Text style={styles.actionBtnText}>
                      {detail.saved ? '🔖 Хадгалсан' : '📑 Хадгалах'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>🔗 Хуваалцах</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && styles.chipActive,
        active && color ? { backgroundColor: color, borderColor: color } : null,
      ]}
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
  filter: { padding: 12, gap: 8, backgroundColor: AppColors.white },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: AppColors.grayMedium, backgroundColor: AppColors.white,
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, color: AppColors.black, fontWeight: '600' },
  chipTextActive: { color: AppColors.white },
  body: { padding: 16 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  srcBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  srcText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
  typeEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginTop: 10 },
  cardBody: { fontSize: 13, color: AppColors.grayDark, marginTop: 6, lineHeight: 18 },
  cardFoot: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: AppColors.grayLight,
  },
  metaText: { fontSize: 11, color: AppColors.grayDark, flex: 0 },
  saveIcon: { fontSize: 18, marginLeft: 'auto' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '92%',
  },
  closeBtn: { fontSize: 22, color: AppColors.grayDark, fontWeight: '700' },
  detailTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginTop: 16 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, marginBottom: 14 },
  detailMetaText: { fontSize: 12, color: AppColors.grayDark },
  audioPlayer: {
    backgroundColor: '#F0FFF4', borderRadius: 10, padding: 20, alignItems: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: '#C6F6D5',
  },
  audioPlayerText: { fontSize: 14, color: AppColors.primaryDark, fontWeight: '600' },
  detailBody: { fontSize: 15, color: AppColors.black, lineHeight: 24, marginBottom: 14 },
  note: {
    padding: 12, backgroundColor: '#FFFBEA', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: AppColors.secondary, marginBottom: 14,
  },
  noteText: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: AppColors.grayLight,
  },
  actionBtnActive: { backgroundColor: '#FFF3E0' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: AppColors.black },
});
