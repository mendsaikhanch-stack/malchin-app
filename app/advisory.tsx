import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import {
  ADVISORY_TEMPLATES,
  ADVISORY_CATEGORIES,
  CATEGORY_LABELS,
  type AdvisoryCategory,
  type AdvisoryTemplate,
} from '@/services/advisory-templates';
import { getSeasonKeyForDate } from '@/hooks/use-seasonal';

const CATEGORY_EMOJI: Record<AdvisoryCategory, string> = {
  migration: '🚶',
  feed: '🌾',
  health: '🩺',
  reproduction: '🤰',
  processing: '🧈',
  emergency: '⚠️',
};

type Filter = AdvisoryCategory | 'all';

export default function AdvisoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const currentSeason = useMemo(() => getSeasonKeyForDate(), []);

  const filtered = useMemo(() => {
    let list =
      filter === 'all'
        ? ADVISORY_TEMPLATES
        : ADVISORY_TEMPLATES.filter((t) => t.category === filter);
    // Season-тэй match-тэй template эхэнд гарна (улирлын хамаарал)
    return [...list].sort((a, b) => {
      const aMatch = a.season?.includes(currentSeason) ? 1 : 0;
      const bMatch = b.season?.includes(currentSeason) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [filter, currentSeason]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ухаалаг зөвлөгөө</Text>
          <Text style={styles.subtitle}>
            15 бэлэн асуулт · Одоо юу хийхийг алхам алхмаар
          </Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <FilterPill
          label="Бүгд"
          emoji="📋"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {ADVISORY_CATEGORIES.map((c) => (
          <FilterPill
            key={c}
            label={CATEGORY_LABELS[c]}
            emoji={CATEGORY_EMOJI[c]}
            active={filter === c}
            onPress={() => setFilter(c)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listBody}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Энэ ангиллын асуулт одоохондоо бүртгэгдээгүй.</Text>
        ) : (
          filtered.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              open={openId === t.id}
              seasonMatch={!!t.season?.includes(currentSeason)}
              onToggle={() => setOpenId(openId === t.id ? null : t.id)}
            />
          ))
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// FilterPill
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  emoji,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// TemplateRow — асуултын карт ба answer block (PRD schema 6 хэсэг)
// ---------------------------------------------------------------------------

function TemplateRow({
  template,
  open,
  seasonMatch,
  onToggle,
}: {
  template: AdvisoryTemplate;
  open: boolean;
  seasonMatch: boolean;
  onToggle: () => void;
}) {
  const a = template.answer;
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={onToggle}>
        <Text style={styles.cardEmoji}>{CATEGORY_EMOJI[template.category]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardQ}>{template.question}</Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardMeta}>{CATEGORY_LABELS[template.category]}</Text>
            {seasonMatch && (
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonBadgeText}>Одоо улирал</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.chev}>{open ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.answer}>
          <Block
            label="Одоо юу хийх"
            color={AppColors.primary}
            text={a.now}
          />
          <Block label="Яагаад" color={AppColors.grayDark} text={a.why} />

          <Text style={styles.blockTitle}>
            <Text style={{ color: AppColors.primary }}>Алхмууд ({a.steps.length})</Text>
          </Text>
          {a.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBullet}>
                <Text style={styles.stepBulletText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}

          {a.caution.length > 0 && (
            <ListBlock
              title="Анхаарах"
              items={a.caution}
              accent={AppColors.warning}
            />
          )}
          {a.risks.length > 0 && (
            <ListBlock
              title="Эрсдэл"
              items={a.risks}
              accent={AppColors.danger}
            />
          )}
          {a.notify.length > 0 && (
            <ListBlock
              title="Хэнд мэдэгдэх"
              items={a.notify}
              accent={AppColors.accent}
            />
          )}
        </View>
      )}
    </View>
  );
}

function Block({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color }]}>{label}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
  );
}

function ListBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: accent }]}>{title}</Text>
      {items.map((x, i) => (
        <View key={i} style={styles.listRow}>
          <View style={[styles.listDot, { backgroundColor: accent }]} />
          <Text style={styles.listText}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 22, fontWeight: '700', color: AppColors.black },
  title: { fontSize: 20, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.grayLight,
  },
  pillActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  pillTextActive: { color: AppColors.white },

  list: { flex: 1 },
  listBody: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: AppColors.gray,
    fontSize: 14,
  },

  card: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardEmoji: { fontSize: 24 },
  cardQ: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  cardMeta: { fontSize: 11, color: AppColors.grayDark },
  seasonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  seasonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
  },
  chev: { fontSize: 18, color: AppColors.gray },

  answer: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: AppColors.grayLight,
  },
  block: { marginTop: 12 },
  blockTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blockText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBulletText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, color: AppColors.black },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  listText: { flex: 1, fontSize: 13, lineHeight: 19, color: AppColors.black },
});
