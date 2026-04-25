import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { knowledgeApi } from '@/services/api';

const categories = [
  { key: '', label: 'Бүгд', emoji: '\uD83D\uDCDA' },
  { key: 'care', label: 'Мал эмнэлэг', emoji: '\uD83D\uDC8A' },
  { key: 'breeding', label: 'Үржил', emoji: '\uD83D\uDC23' },
  { key: 'seasonal', label: 'Улирлын ажил', emoji: '\uD83C\uDF43' },
  { key: 'folk_wisdom', label: 'Ардын ухаан', emoji: '\uD83E\uDDD9' },
];

const animalFilters = [
  { key: '', label: 'Бүгд', emoji: '\uD83D\uDC3E' },
  { key: 'sheep', label: 'Хонь', emoji: '\uD83D\uDC11' },
  { key: 'goat', label: 'Ямаа', emoji: '\uD83D\uDC10' },
  { key: 'cattle', label: 'Үхэр', emoji: '\uD83D\uDC02' },
  { key: 'horse', label: 'Адуу', emoji: '\uD83D\uDC0E' },
  { key: 'camel', label: 'Тэмээ', emoji: '\uD83D\uDC2A' },
];

const seasonEmoji: Record<string, string> = {
  spring: '\uD83C\uDF38', summer: '\u2600\uFE0F', autumn: '\uD83C\uDF42', winter: '\u2744\uFE0F' };
const seasonLabel: Record<string, string> = {
  spring: 'Хавар', summer: 'Зун', autumn: 'Намар', winter: 'Өвөл' };

export default function KnowledgeScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dailyTip, setDailyTip] = useState<any>(null);

  const loadData = async () => {
    try {
      if (searchQuery.trim()) {
        const data = await knowledgeApi.search(searchQuery.trim());
        setItems(data || []);
      } else {
        const data = await knowledgeApi.getAll(selectedCat || undefined, selectedAnimal || undefined);
        setItems(data || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadTip = async () => {
    try {
      const res = await knowledgeApi.getDailyTip();
      setDailyTip(res?.tip);
    } catch {}
  };

  useEffect(() => { loadTip(); }, []);
  useEffect(() => { setLoading(true); loadData(); }, [selectedCat, selectedAnimal, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\uD83D\uDCDA'} Мал маллах ухаан</Text>
      </View>

      {/* Хайлт */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Хайх... (жнь: тураал, ноолуур)"
          placeholderTextColor={AppColors.gray}
        />
      </View>

      {/* Категори */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.key} style={[styles.chip, selectedCat === cat.key && styles.chipActive]} onPress={() => setSelectedCat(cat.key)}>
            <Text style={[styles.chipText, selectedCat === cat.key && styles.chipTextActive]}>{cat.emoji} {cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Малын төрөл */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll2} contentContainerStyle={styles.filterContent}>
        {animalFilters.map((a) => (
          <TouchableOpacity key={a.key} style={[styles.chipSmall, selectedAnimal === a.key && styles.chipSmallActive]} onPress={() => setSelectedAnimal(a.key)}>
            <Text style={[styles.chipSmallText, selectedAnimal === a.key && styles.chipSmallTextActive]}>{a.emoji} {a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Өдрийн зөвлөгөө */}
        {dailyTip && !searchQuery && !selectedCat && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>{'\uD83D\uDCA1'} Өдрийн мэдлэг</Text>
            <Text style={styles.tipHeading}>{dailyTip.title}</Text>
            <Text style={styles.tipContent}>{dailyTip.content}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.resultCount}>{items.length} мэдлэг олдлоо</Text>
            {items.map((item: any) => {
              const isExpanded = expandedId === item.id;
              const catInfo = categories.find(c => c.key === item.category) || { emoji: '\uD83D\uDCCB', label: item.category };
              return (
                <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.8}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemEmoji}>{catInfo.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.tagRow}>
                        {item.animal_type ? (
                          <View style={styles.tag}><Text style={styles.tagText}>{animalFilters.find(a => a.key === item.animal_type)?.emoji || ''} {animalFilters.find(a => a.key === item.animal_type)?.label || item.animal_type}</Text></View>
                        ) : null}
                        {item.season ? (
                          <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}><Text style={styles.tagText}>{seasonEmoji[item.season] || ''} {seasonLabel[item.season] || item.season}</Text></View>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.itemBody}>
                      <Text style={styles.itemContent}>{item.content}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {items.length === 0 && <Text style={styles.emptyText}>Мэдлэг олдсонгүй</Text>}
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
  searchContainer: { paddingHorizontal: 16, marginTop: 8 },
  searchInput: { backgroundColor: AppColors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: AppColors.black, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  filterScroll: { marginTop: 10 },
  filterScroll2: { marginTop: 6 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.grayMedium },
  chipSmallActive: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  chipSmallText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  chipSmallTextActive: { color: AppColors.white },
  tipCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF8E1', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFE082' },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#F57F17' },
  tipHeading: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginTop: 6 },
  tipContent: { fontSize: 13, color: AppColors.grayDark, lineHeight: 20, marginTop: 6 },
  resultCount: { paddingHorizontal: 20, marginTop: 12, fontSize: 12, color: AppColors.gray },
  itemCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 8, borderRadius: 14, padding: 14, boxShadow: '0px 1px 6px rgba(0,0,0,0.05)',     elevation: 2 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  itemEmoji: { fontSize: 24, marginRight: 10, marginTop: 2 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, lineHeight: 20 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '600', color: AppColors.grayDark },
  expandIcon: { fontSize: 12, color: AppColors.gray, marginTop: 4 },
  itemBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  itemContent: { fontSize: 13, color: AppColors.grayDark, lineHeight: 21 },
  emptyText: { textAlign: 'center', color: AppColors.gray, marginTop: 30, fontSize: 14 } });
