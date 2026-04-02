import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { shinjikhApi } from '@/services/api';

const categoryConfig: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  weather: { label: 'Тэнгэр цаг агаар', emoji: '\uD83C\uDF24\uFE0F', color: '#1565C0', desc: 'Үүл, нар, сар, салхи, одоор цаг шинжих' },
  livestock: { label: 'Мал шинжих', emoji: '\uD83D\uDC11', color: '#2E7D32', desc: 'Хонь, ямаа, үхэр, тэмээний чанар шинжих' },
  racehorse: { label: 'Хурдан морь', emoji: '\uD83C\uDFC7', color: '#E65100', desc: 'Хурдан морь сонгох, бэлтгэх, шинжих' },
  sire: { label: 'Эцэг мал', emoji: '\uD83D\uDCAA', color: '#6A1B9A', desc: 'Хуц, ухна, бух, азарга шинжих' },
  dam: { label: 'Эм мал', emoji: '\u2764\uFE0F', color: '#C62828', desc: 'Эх мал, сааль мал шинжих' },
  land: { label: 'Газар орон', emoji: '\uD83C\uDFD4\uFE0F', color: '#00695C', desc: 'Өвөлжөө, зуслан, ус, отрын газар' },
};

export default function ShinjikhScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      if (searchQuery.trim()) {
        const data = await shinjikhApi.search(searchQuery.trim());
        setItems(data || []);
      } else {
        const data = await shinjikhApi.getAll(selectedCat || undefined);
        setItems(data || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); loadData(); }, [selectedCat, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{'\uD83D\uDD2E'} Шинжих ухаан</Text>
          <Text style={styles.subtitle}>Монгол ардын уламжлалт мэдлэг</Text>
        </View>

        {/* Хайлт */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Хайх... (жнь: морь, бороо, худаг)"
            placeholderTextColor={AppColors.gray}
          />
        </View>

        {/* Категори сонголт */}
        {!searchQuery && !selectedCat && (
          <View style={styles.catGrid}>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <TouchableOpacity key={key} style={[styles.catCard, { borderLeftColor: cfg.color }]} onPress={() => setSelectedCat(key)}>
                <Text style={styles.catEmoji}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catTitle}>{cfg.label}</Text>
                  <Text style={styles.catDesc}>{cfg.desc}</Text>
                </View>
                <Text style={styles.catArrow}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Буцах товч */}
        {(selectedCat || searchQuery) && (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedCat(''); setSearchQuery(''); setExpandedId(null); }}>
            <Text style={styles.backBtnText}>{'\u2190'} Бүх ангилал</Text>
          </TouchableOpacity>
        )}

        {/* Сонгосон ангилалын гарчиг */}
        {selectedCat && categoryConfig[selectedCat] && (
          <View style={[styles.catHeader, { backgroundColor: categoryConfig[selectedCat].color + '12' }]}>
            <Text style={styles.catHeaderEmoji}>{categoryConfig[selectedCat].emoji}</Text>
            <Text style={[styles.catHeaderTitle, { color: categoryConfig[selectedCat].color }]}>{categoryConfig[selectedCat].label}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} />
        ) : (selectedCat || searchQuery) ? (
          <>
            {items.map((item: any) => {
              const isExpanded = expandedId === item.id;
              const cfg = categoryConfig[item.category] || { color: AppColors.gray, emoji: '\uD83D\uDCCB' };
              return (
                <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.85}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemEmoji}>{item.emoji || cfg.emoji}</Text>
                    <Text style={[styles.itemTitle, { flex: 1 }]}>{item.title}</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                  </View>
                  <Text style={styles.itemSummary} numberOfLines={isExpanded ? undefined : 2}>{item.content}</Text>
                  {isExpanded && item.details ? (
                    <View style={styles.detailsBox}>
                      <Text style={styles.detailsText}>{item.details}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {items.length === 0 && <Text style={styles.emptyText}>Мэдээлэл олдсонгүй</Text>}
          </>
        ) : null}

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
  searchBox: { paddingHorizontal: 16, marginTop: 10 },
  searchInput: { backgroundColor: AppColors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: AppColors.black, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  // Category grid
  catGrid: { paddingHorizontal: 16, marginTop: 12 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  catEmoji: { fontSize: 32, marginRight: 12 },
  catTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  catDesc: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  catArrow: { fontSize: 24, color: AppColors.gray },
  // Back
  backBtn: { paddingHorizontal: 20, marginTop: 10 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
  // Category header
  catHeader: { marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  catHeaderEmoji: { fontSize: 28, marginRight: 10 },
  catHeaderTitle: { fontSize: 18, fontWeight: '800' },
  // Items
  itemCard: {
    backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 8, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemEmoji: { fontSize: 22, marginRight: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  expandIcon: { fontSize: 12, color: AppColors.gray },
  itemSummary: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19, marginTop: 8 },
  detailsBox: { marginTop: 10, padding: 12, backgroundColor: '#F5F5F0', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  detailsText: { fontSize: 13, color: AppColors.black, lineHeight: 22 },
  emptyText: { textAlign: 'center', color: AppColors.gray, marginTop: 30, fontSize: 14 },
});
