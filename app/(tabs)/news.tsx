import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { newsApi } from '@/services/api';
import { AdBanner } from '@/components/ad-banner';

const tabs = ['Мэдээ', 'Боломж', 'Гадаад ханш'];

const newsCatLabels: Record<string, { label: string; emoji: string; color: string }> = {
  government: { label: 'Засгийн газар', emoji: '\uD83C\uDFDB\uFE0F', color: '#1565C0' },
  intl_market: { label: 'Гадаад зах зээл', emoji: '\uD83C\uDF0D', color: '#6A1B9A' },
  local: { label: 'Орон нутаг', emoji: '\uD83C\uDFD8\uFE0F', color: '#2E7D32' },
  opportunity: { label: 'Боломж', emoji: '\uD83D\uDCA1', color: '#E65100' },
};

const programCatLabels: Record<string, { label: string; emoji: string }> = {
  loan: { label: 'Зээл', emoji: '\uD83C\uDFE6' },
  grant: { label: 'Грант / Тусламж', emoji: '\uD83C\uDF81' },
  training: { label: 'Сургалт', emoji: '\uD83C\uDF93' },
  insurance: { label: 'Даатгал', emoji: '\uD83D\uDEE1\uFE0F' },
  subsidy: { label: 'Урамшуулал', emoji: '\uD83D\uDCB0' },
};

function fmt(n: number) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pct(cur: number, prev: number) {
  if (!prev) return { text: '', color: AppColors.gray };
  const p = ((cur - prev) / prev * 100).toFixed(1);
  if (cur > prev) return { text: `+${p}%`, color: '#2E7D32' };
  if (cur < prev) return { text: `${p}%`, color: AppColors.danger };
  return { text: '0%', color: AppColors.gray };
}
function timeAgo(dateStr: string) {
  const now = new Date(); const d = new Date(dateStr + 'Z');
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цаг`;
  return `${Math.floor(diff / 86400)} өдөр`;
}
function daysLeft(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr); const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return 'Дууссан';
  if (diff === 0) return 'Өнөөдөр';
  return `${diff} өдөр үлдсэн`;
}

export default function NewsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [intlPrices, setIntlPrices] = useState<any[]>([]);
  const [newsCatFilter, setNewsCatFilter] = useState('');
  const [progCatFilter, setProgCatFilter] = useState('');

  const loadData = async () => {
    try {
      if (activeTab === 0) {
        const data = await newsApi.getAll(newsCatFilter || undefined);
        setNews(data || []);
      } else if (activeTab === 1) {
        const data = await newsApi.getPrograms(progCatFilter || undefined);
        setPrograms(data || []);
      } else {
        const data = await newsApi.getIntlPrices();
        setIntlPrices(data || []);
      }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { setLoading(true); loadData(); }, [activeTab, newsCatFilter, progCatFilter]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  // === МЭДЭЭ ===
  const renderNews = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, !newsCatFilter && styles.chipActive]} onPress={() => setNewsCatFilter('')}>
          <Text style={[styles.chipText, !newsCatFilter && styles.chipTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {Object.entries(newsCatLabels).map(([key, val]) => (
          <TouchableOpacity key={key} style={[styles.chip, newsCatFilter === key && styles.chipActive]} onPress={() => setNewsCatFilter(key)}>
            <Text style={[styles.chipText, newsCatFilter === key && styles.chipTextActive]}>{val.emoji} {val.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {news.map((item: any) => {
        const cat = newsCatLabels[item.category] || { label: item.category, emoji: '\uD83D\uDCF0', color: AppColors.gray };
        return (
          <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.8}>
            {item.is_urgent ? (
              <View style={styles.urgentBadge}><Text style={styles.urgentText}>{'\uD83D\uDD14'} Яаралтай</Text></View>
            ) : null}
            <View style={styles.newsHeader}>
              <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
                <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
              </View>
              <Text style={styles.timeText}>{timeAgo(item.published_at)} өмнө</Text>
            </View>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.newsSummary}>{item.summary}</Text>
            <View style={styles.newsFooter}>
              <Text style={styles.sourceText}>{item.source}</Text>
              {item.region ? <Text style={styles.regionBadgeText}>{'\uD83D\uDCCD'} {item.region}</Text> : null}
            </View>
          </TouchableOpacity>
        );
      })}
      {news.length === 0 && !loading && <Text style={styles.emptyText}>Мэдээ олдсонгүй</Text>}
    </>
  );

  // === БОЛОМЖ ===
  const renderPrograms = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, !progCatFilter && styles.chipActive]} onPress={() => setProgCatFilter('')}>
          <Text style={[styles.chipText, !progCatFilter && styles.chipTextActive]}>Бүгд</Text>
        </TouchableOpacity>
        {Object.entries(programCatLabels).map(([key, val]) => (
          <TouchableOpacity key={key} style={[styles.chip, progCatFilter === key && styles.chipActive]} onPress={() => setProgCatFilter(key)}>
            <Text style={[styles.chipText, progCatFilter === key && styles.chipTextActive]}>{val.emoji} {val.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {programs.map((pg: any) => {
        const cat = programCatLabels[pg.category] || { label: pg.category, emoji: '\uD83D\uDCCB' };
        const dl = daysLeft(pg.deadline);
        const isUrgent = dl.includes('өдөр') && parseInt(dl) <= 30;
        return (
          <View key={pg.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <Text style={styles.programEmoji}>{cat.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.programCat}>{cat.label}</Text>
                <Text style={styles.programTitle}>{pg.title}</Text>
              </View>
              {pg.amount ? <View style={styles.amountBadge}><Text style={styles.amountText}>{pg.amount}</Text></View> : null}
            </View>
            <Text style={styles.programDesc}>{pg.description}</Text>
            <View style={styles.programDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Байгууллага</Text>
                <Text style={styles.detailValue}>{pg.organization}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Шалгуур</Text>
                <Text style={styles.detailValue}>{pg.eligibility}</Text>
              </View>
              {pg.deadline ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Хугацаа</Text>
                  <Text style={[styles.detailValue, isUrgent && { color: AppColors.danger, fontWeight: '700' }]}>
                    {pg.deadline} ({dl})
                  </Text>
                </View>
              ) : null}
            </View>
            {pg.contact ? (
              <TouchableOpacity style={styles.contactBtn} onPress={() => {
                if (pg.contact.includes('@')) Linking.openURL(`mailto:${pg.contact}`);
                else Linking.openURL(`tel:${pg.contact}`);
              }}>
                <Text style={styles.contactBtnText}>{'\uD83D\uDCDE'} {pg.contact}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
      {programs.length === 0 && !loading && <Text style={styles.emptyText}>Хөтөлбөр олдсонгүй</Text>}
    </>
  );

  // === ГАДААД ХАНШ ===
  const renderIntlPrices = () => (
    <>
      <View style={styles.intlCard}>
        <Text style={styles.intlTitle}>{'\uD83C\uDF0D'} Олон улсын зах зээлийн ханш (USD)</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2.5 }]}>Бүтээгдэхүүн</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Үнэ</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>Өөрч.</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Бирж</Text>
        </View>
        {intlPrices.map((item: any, i: number) => {
          const change = pct(item.price_usd, item.prev_price_usd);
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <View style={{ flex: 2.5 }}>
                <Text style={styles.itemName}>{item.commodity_mn}</Text>
                <Text style={styles.unitText}>{item.unit}</Text>
              </View>
              <Text style={[styles.td, { flex: 1.2, fontWeight: '700' }]}>${item.price_usd}</Text>
              <Text style={[styles.td, { flex: 0.8, color: change.color, fontWeight: '700' }]}>{change.text}</Text>
              <Text style={[styles.td, { flex: 1.5, fontSize: 10, color: AppColors.gray }]}>{item.market}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>{'\u2139\uFE0F'} Ханш нь олон улсын биржийн мэдээлэлд үндэслэсэн бөгөөд бодит арилжааны үнээс зөрж болно.</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\uD83D\uDCF0'} Мэдээ & Боломж</Text>
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 0 && renderNews()}
            {activeTab === 1 && renderPrograms()}
            {activeTab === 2 && renderIntlPrices()}
          </>
        )}
        <AdBanner placement="news" />
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },
  // Tabs
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#EEEEEE', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: AppColors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: AppColors.primary, fontWeight: '700' },
  // Filter
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: AppColors.white, borderWidth: 1.5, borderColor: AppColors.grayMedium },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  // News
  newsCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  urgentBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: AppColors.gray },
  newsTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, lineHeight: 21 },
  newsSummary: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19, marginTop: 6 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sourceText: { fontSize: 11, color: AppColors.gray, fontWeight: '600' },
  regionBadgeText: { fontSize: 11, color: AppColors.accent },
  // Programs
  programCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  programHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  programEmoji: { fontSize: 28, marginRight: 10 },
  programCat: { fontSize: 11, color: AppColors.gray, fontWeight: '600' },
  programTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, lineHeight: 20, marginTop: 2 },
  amountBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 8 },
  amountText: { fontSize: 12, fontWeight: '800', color: AppColors.primaryDark },
  programDesc: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19, marginTop: 8 },
  programDetails: { marginTop: 10, backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10 },
  detailItem: { flexDirection: 'row', marginBottom: 4 },
  detailLabel: { fontSize: 12, color: AppColors.gray, width: 85, fontWeight: '600' },
  detailValue: { fontSize: 12, color: AppColors.black, flex: 1 },
  contactBtn: { marginTop: 10, backgroundColor: AppColors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  contactBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  // Intl prices
  intlCard: { backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  intlTitle: { fontSize: 15, fontWeight: '800', color: AppColors.black, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: AppColors.grayMedium, paddingBottom: 6, marginBottom: 4 },
  th: { fontSize: 10, fontWeight: '700', color: AppColors.gray, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  itemName: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  unitText: { fontSize: 10, color: AppColors.gray },
  td: { fontSize: 12, color: AppColors.black },
  noteCard: { marginHorizontal: 16, marginTop: 10, padding: 12, backgroundColor: '#FFF8E1', borderRadius: 10 },
  noteText: { fontSize: 12, color: '#F57F17', lineHeight: 18 },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 40 },
});
