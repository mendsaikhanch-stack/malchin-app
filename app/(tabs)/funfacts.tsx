import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { funFactsApi } from '@/services/api';

const categoryConfig: Record<string, { label: string; emoji: string; color: string }> = {
  animal_fact: { label: 'Малын нууц', emoji: '\uD83E\uDDE0', color: '#1565C0' },
  tradition: { label: 'Уламжлал', emoji: '\uD83C\uDFAD', color: '#6A1B9A' },
  nature: { label: 'Байгаль', emoji: '\uD83C\uDF3F', color: '#2E7D32' },
  world: { label: 'Дэлхий', emoji: '\uD83C\uDF0D', color: '#E65100' },
  funny: { label: 'Хөгжилтэй', emoji: '\uD83D\uDE02', color: '#C62828' },
  health: { label: 'Эрүүл мэнд', emoji: '\uD83D\uDC9A', color: '#00695C' },
  stats: { label: 'Тоо баримт', emoji: '\uD83D\uDCCA', color: '#4527A0' },
};

export default function FunFactsScreen() {
  const [loading, setLoading] = useState(true);
  const [facts, setFacts] = useState<any[]>([]);
  const [dailyFact, setDailyFact] = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [allRes, dailyRes] = await Promise.allSettled([
        funFactsApi.getAll(selectedCat || undefined),
        funFactsApi.getDaily(),
      ]);
      if (allRes.status === 'fulfilled') setFacts(allRes.value || []);
      if (dailyRes.status === 'fulfilled') setDailyFact(dailyRes.value);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); loadData(); }, [selectedCat]);

  const shareFact = async (fact: any) => {
    try {
      await Share.share({
        message: `${fact.emoji} ${fact.title}\n\n${fact.content}\n\n- Малчин апп`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{'\uD83D\uDCA1'} Танин мэдэхүй</Text>
          <Text style={styles.subtitle}>Сонирхолтой баримт & мэдлэг</Text>
        </View>

        {/* Өдрийн баримт */}
        {dailyFact && !selectedCat && (
          <TouchableOpacity style={styles.dailyCard} onPress={() => shareFact(dailyFact)} activeOpacity={0.9}>
            <Text style={styles.dailyLabel}>{'\u2728'} Өдрийн баримт</Text>
            <Text style={styles.dailyEmoji}>{dailyFact.emoji}</Text>
            <Text style={styles.dailyTitle}>{dailyFact.title}</Text>
            <Text style={styles.dailyContent}>{dailyFact.content}</Text>
            <View style={styles.dailyFooter}>
              <Text style={styles.dailySource}>{dailyFact.source}</Text>
              <Text style={styles.shareHint}>Хуваалцах {'\u27A4'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Категори шүүлтүүр */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity style={[styles.chip, !selectedCat && styles.chipActive]} onPress={() => setSelectedCat('')}>
            <Text style={[styles.chipText, !selectedCat && styles.chipTextActive]}>{'\uD83D\uDCDA'} Бүгд</Text>
          </TouchableOpacity>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <TouchableOpacity key={key} style={[styles.chip, selectedCat === key && styles.chipActive]} onPress={() => setSelectedCat(key)}>
              <Text style={[styles.chipText, selectedCat === key && styles.chipTextActive]}>{cfg.emoji} {cfg.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.countText}>{facts.length} баримт</Text>
            {facts.map((fact: any) => {
              const cfg = categoryConfig[fact.category] || { label: fact.category, emoji: '\uD83D\uDCCB', color: AppColors.gray };
              const isExpanded = expandedId === fact.id;
              return (
                <TouchableOpacity
                  key={fact.id}
                  style={styles.factCard}
                  onPress={() => setExpandedId(isExpanded ? null : fact.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.factHeader}>
                    <Text style={styles.factEmoji}>{fact.emoji || cfg.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.catPill, { backgroundColor: cfg.color + '15' }]}>
                        <Text style={[styles.catPillText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      <Text style={styles.factTitle}>{fact.title}</Text>
                    </View>
                    <Text style={styles.expandArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.factBody}>
                      <Text style={styles.factContent}>{fact.content}</Text>
                      <View style={styles.factFooter}>
                        <Text style={styles.factSource}>{fact.source}</Text>
                        <TouchableOpacity onPress={() => shareFact(fact)} style={styles.shareBtn}>
                          <Text style={styles.shareBtnText}>{'\uD83D\uDCE4'} Хуваалцах</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  // Daily fact
  dailyCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 20,
    backgroundColor: '#1A237E', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  dailyLabel: { fontSize: 12, fontWeight: '700', color: '#FFD54F' },
  dailyEmoji: { fontSize: 40, marginTop: 8 },
  dailyTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 8, lineHeight: 24 },
  dailyContent: { fontSize: 14, color: '#B3B3CC', lineHeight: 22, marginTop: 8 },
  dailyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dailySource: { fontSize: 11, color: '#7C7C9A' },
  shareHint: { fontSize: 11, color: '#FFD54F', fontWeight: '600' },
  // Filter
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  countText: { paddingHorizontal: 20, marginTop: 10, fontSize: 12, color: AppColors.gray },
  // Fact card
  factCard: {
    backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 8, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  factHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  factEmoji: { fontSize: 28, marginRight: 10, marginTop: 2 },
  catPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  catPillText: { fontSize: 10, fontWeight: '700' },
  factTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, lineHeight: 20 },
  expandArrow: { fontSize: 12, color: AppColors.gray, marginTop: 6 },
  factBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  factContent: { fontSize: 14, color: AppColors.grayDark, lineHeight: 22 },
  factFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  factSource: { fontSize: 11, color: AppColors.gray, fontStyle: 'italic' },
  shareBtn: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareBtnText: { fontSize: 11, fontWeight: '600', color: '#1565C0' },
});
