import React, { useEffect, useState, useCallback } from 'react';
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
import { insuranceApi } from '@/services/api';

const BRAND = {
  primary: '#2d5016',
  primaryLight: '#4a7c28',
  bg: '#f5f7f0' };

type TabKey = 'types' | 'calc' | 'guide';

function formatPrice(n: number): string {
  return '₮' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function LivestockInsuranceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('types');
  const [data, setData] = useState<any>(null);

  // Expanded
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Calculator
  const [calcBod, setCalcBod] = useState('10');
  const [calcBog, setCalcBog] = useState('50');
  const [calcResult, setCalcResult] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const result = await insuranceApi.getAll();
      setData(result);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleCalc = async () => {
    const bod = parseInt(calcBod) || 0;
    const bog = parseInt(calcBog) || 0;
    try {
      const result = await insuranceApi.livestockCalc(bod, bog);
      setCalcResult(result);
    } catch {
      const bodPremium = bod * 2000;
      const bogPremium = bog * 500;
      setCalcResult({
        bod_count: bod, bog_count: bog, total_head: bod + bog,
        bod_premium: bodPremium, bog_premium: bogPremium, total_premium: bodPremium + bogPremium,
        estimated_compensation: { bod: bod * 150000, bog: bog * 50000, total: bod * 150000 + bog * 50000 } });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </SafeAreaView>
    );
  }

  const livestockTypes = data?.livestock_insurance || [];
  const livestockDocs = data?.livestock_docs;

  // ─── Tab 1: Даатгалын төрлүүд ───
  const renderTypes = () => (
    <>
      <View style={styles.infoBox}>
        <Text style={styles.infoEmoji}>🐑</Text>
        <Text style={styles.infoText}>
          Малын даатгал нь зуд, ган, гамшгийн үед малын хорогдлын хохирлыг нөхөх зорилготой. Монголд IBLI, арилжааны, зудын, бичил гэсэн 4 төрлийн даатгал байна.
        </Text>
      </View>

      {livestockTypes.map((ins: any) => {
        const isExpanded = expandedId === ins.id;
        return (
          <TouchableOpacity
            key={ins.id}
            style={styles.card}
            onPress={() => setExpandedId(isExpanded ? null : ins.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{ins.emoji}</Text>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardTitle}>{ins.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 2}>{ins.description}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>

            {isExpanded && (
              <View style={styles.cardBody}>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMetaLabel}>Хэнд:</Text>
                  <Text style={styles.cardMetaValue}>{ins.who}</Text>
                </View>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMetaLabel}>Давуу тал:</Text>
                  <Text style={styles.cardMetaValue}>{ins.benefit}</Text>
                </View>
                <View style={styles.detailsBox}>
                  {ins.details?.map((d: any, idx: number) => (
                    <View key={idx} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <Text style={styles.detailValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {livestockDocs && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{livestockDocs.emoji}</Text>
            <Text style={[styles.cardTitle, { flex: 1 }]}>{livestockDocs.title}</Text>
          </View>
          <View style={styles.docList}>
            {livestockDocs.items?.map((item: string, idx: number) => (
              <View key={idx} style={styles.docItem}>
                <Text style={styles.docBullet}>✓</Text>
                <Text style={styles.docText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Жилийн хуанли */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📅 Малын даатгалын хуанли</Text>
        {[
          { month: '4-6 сар', event: 'IBLI даатгалд бүртгүүлэх хугацаа', emoji: '📝' },
          { month: '6 сарын 1', event: 'Даатгалын хугацаа эхлэх', emoji: '🟢' },
          { month: '10-12 сар', event: 'Өвөлжилтийн бэлтгэл, нөхцөл шалгах', emoji: '❄️' },
          { month: '1-3 сар', event: 'Зудын мониторинг, хохирлын үнэлгээ', emoji: '📊' },
          { month: '5 сарын 31', event: 'Даатгалын хугацаа дуусах', emoji: '🔴' },
          { month: '5-6 сар', event: 'Нөхөн олговор олгох (босго давсан бол)', emoji: '💰' },
        ].map((item, idx) => (
          <View key={idx} style={styles.calendarRow}>
            <Text style={styles.calendarEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.calendarMonth}>{item.month}</Text>
              <Text style={styles.calendarEvent}>{item.event}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Tab 2: Тооцоолуур ───
  const renderCalc = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🧮 Малын даатгалын тооцоолуур</Text>
        <Text style={styles.calcHint}>
          Бод, бог малын тоогоо оруулж IBLI даатгалын шимтгэл болон нөхөн олговрыг тооцоолно.
        </Text>

        <View style={styles.calcRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>🐄 Бод мал</Text>
            <Text style={styles.inputHint}>Морь, үхэр, тэмээ</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={calcBod}
              onChangeText={setCalcBod}
              placeholder="10"
              placeholderTextColor={AppColors.gray}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>🐑 Бог мал</Text>
            <Text style={styles.inputHint}>Хонь, ямаа</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={calcBog}
              onChangeText={setCalcBog}
              placeholder="50"
              placeholderTextColor={AppColors.gray}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.calcBtn} onPress={handleCalc}>
          <Text style={styles.calcBtnText}>Тооцоолох</Text>
        </TouchableOpacity>
      </View>

      {calcResult && (
        <>
          {/* Шимтгэлийн тооцоо */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💳 Жилийн шимтгэл</Text>
            <Text style={styles.calcSubtitle}>
              Нийт: {calcResult.total_head} толгой ({calcResult.bod_count} бод + {calcResult.bog_count} бог)
            </Text>

            <View style={styles.resultBox}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🐄 Бод малын шимтгэл</Text>
                <Text style={styles.resultValue}>{formatPrice(calcResult.bod_premium)}</Text>
              </View>
              <Text style={styles.resultNote}>{calcResult.bod_count} толгой × ₮2,000</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🐑 Бог малын шимтгэл</Text>
                <Text style={styles.resultValue}>{formatPrice(calcResult.bog_premium)}</Text>
              </View>
              <Text style={styles.resultNote}>{calcResult.bog_count} толгой × ₮500</Text>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Жилийн нийт шимтгэл</Text>
                <Text style={styles.totalValue}>{formatPrice(calcResult.total_premium)}</Text>
              </View>
            </View>
          </View>

          {/* Нөхөн олговрын тооцоо */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💰 Нөхөн олговор (ойролцоо)</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoEmoji}>💡</Text>
              <Text style={styles.infoText}>
                Аймаг/сумын хэмжээнд малын хорогдол 6%-иас давсан тохиолдолд нөхөн олговор олгоно.
              </Text>
            </View>

            <View style={styles.resultBox}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🐄 Бод мал</Text>
                <Text style={styles.resultValue}>{formatPrice(calcResult.estimated_compensation.bod)}</Text>
              </View>
              <Text style={styles.resultNote}>{calcResult.bod_count} толгой × ~₮150,000</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🐑 Бог мал</Text>
                <Text style={styles.resultValue}>{formatPrice(calcResult.estimated_compensation.bog)}</Text>
              </View>
              <Text style={styles.resultNote}>{calcResult.bog_count} толгой × ~₮50,000</Text>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Нийт нөхөн олговор</Text>
                <Text style={[styles.totalValue, { color: '#2E7D32' }]}>{formatPrice(calcResult.estimated_compensation.total)}</Text>
              </View>
            </View>

            {/* ROI */}
            <View style={styles.roiBox}>
              <Text style={styles.roiTitle}>📈 Үр ашгийн харьцуулалт</Text>
              <Text style={styles.roiText}>
                Шимтгэл: {formatPrice(calcResult.total_premium)} → Олговор: {formatPrice(calcResult.estimated_compensation.total)}
              </Text>
              <Text style={styles.roiHighlight}>
                {calcResult.total_premium > 0 ? Math.round(calcResult.estimated_compensation.total / calcResult.total_premium) : 0}x буцаалт
              </Text>
            </View>
          </View>

          {/* Түгээмэл жишээ */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📋 Түгээмэл малын тоогоор</Text>
            {[
              { bod: 5, bog: 30, label: 'Жижиг малчин' },
              { bod: 15, bog: 100, label: 'Дунд малчин' },
              { bod: 30, bog: 300, label: 'Том малчин' },
              { bod: 50, bog: 500, label: 'Мянгат малчин' },
            ].map((ex, idx) => {
              const premium = ex.bod * 2000 + ex.bog * 500;
              const comp = ex.bod * 150000 + ex.bog * 50000;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.exampleRow}
                  onPress={() => { setCalcBod(String(ex.bod)); setCalcBog(String(ex.bog)); handleCalc(); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exampleLabel}>{ex.label}</Text>
                    <Text style={styles.exampleMeta}>{ex.bod} бод + {ex.bog} бог</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.examplePremium}>{formatPrice(premium)}/жил</Text>
                    <Text style={styles.exampleComp}>→ {formatPrice(comp)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </>
  );

  // ─── Tab 3: Бүртгүүлэх заавар ───
  const renderGuide = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 IBLI даатгалд бүртгүүлэх</Text>
        {[
          { step: '1', title: 'Мал тооллогын бүртгэл (А данс) бэлдэх', desc: 'Сумын мал эмнэлэг, ЗДТГ-аас мал тооллогын бүртгэлээ авна', icon: '📄' },
          { step: '2', title: 'Сумын ЗДТГ-д хандах', desc: 'Малчин гэсэн тодорхойлолт авах. Иргэний үнэмлэх, А данс авч очих', icon: '🏢' },
          { step: '3', title: 'Даатгалын байгууллагад бүртгүүлэх', desc: 'Сумын НД-ын байцаагч эсвэл даатгалын компани руу хандана', icon: '🏦' },
          { step: '4', title: 'Шимтгэл төлөх', desc: 'Банкны шилжүүлэг, утасны банк, эсвэл бэлнээр. Жилд нэг удаа', icon: '💳' },
          { step: '5', title: 'Гэрээ авах', desc: 'Даатгалын гэрээ, баталгааны хуудас авч хадгална', icon: '📋' },
        ].map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{item.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{item.icon} {item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Бүрдүүлэх бичиг баримт */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📎 Бүрдүүлэх бичиг баримт</Text>
        {[
          'Иргэний үнэмлэх (эх хувь)',
          'Мал тооллогын бүртгэл (А данс)',
          'Сумын Засаг даргын тодорхойлолт',
          'Банкны дансны дугаар',
          'Малын ээмэг/чипний мэдээлэл (байгаа бол)',
          'Өмнөх жилийн малын тоо толгойн мэдээ',
        ].map((doc, idx) => (
          <View key={idx} style={styles.docItem}>
            <Text style={styles.docBullet}>✓</Text>
            <Text style={styles.docText}>{doc}</Text>
          </View>
        ))}
      </View>

      {/* Нөхөн олговор авах */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💰 Нөхөн олговор авах заавар</Text>
        {[
          { step: '1', title: 'Хохирлын мэдэгдэл өгөх', desc: 'Малын хорогдол гарсан тухай сумын ЗДТГ, мал эмнэлэгт мэдэгдэнэ', icon: '📢' },
          { step: '2', title: 'Хохирлын үнэлгээ', desc: 'Аймаг/сумын хэмжээнд малын хорогдлын индекс тооцогдоно', icon: '📊' },
          { step: '3', title: 'Босго хувь шалгах', desc: '6%-иас дээш хорогдол байвал нөхөн олговор олгоно', icon: '📏' },
          { step: '4', title: 'Олговор олгох', desc: 'Бүртгэлтэй банкны дансанд шилжүүлнэ (5-6 сард)', icon: '💳' },
        ].map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: '#E65100' }]}>
              <Text style={styles.stepNumber}>{item.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{item.icon} {item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Түгээмэл асуулт */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>❓ Түгээмэл асуулт</Text>
        {[
          { q: 'IBLI даатгал гэж юу вэ?', a: 'Индексжүүлсэн малын даатгал. Бүс нутгийн дундаж хорогдлоор тооцож, босго давсан бол автомат олговор олгоно.' },
          { q: 'Хэзээ бүртгүүлэх вэ?', a: 'Жил бүрийн 4-6 сард бүртгүүлнэ. Бусад хугацаанд бүртгүүлэх боломжгүй.' },
          { q: 'Босго хувь гэж юу вэ?', a: 'Аймаг/сумын хэмжээнд малын хорогдлын дундаж 6%-иас давсан тохиолдолд нөхөн олговор олгоно.' },
          { q: 'Нөхөн олговрыг хэзээ авах вэ?', a: 'Даатгалын хугацаа дууссаны дараа, ихэвчлэн 5-6 сард олгоно.' },
          { q: 'Бүх төрлийн мал даатгуулж болох уу?', a: 'Тийм, 5 төрлийн мал (адуу, үхэр, тэмээ, хонь, ямаа) бүгдийг даатгуулна.' },
        ].map((faq, idx) => (
          <View key={idx} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🐑 Малын даатгал</Text>
          <Text style={styles.subtitle}>Малын эрсдэлийн даатгалын мэдээлэл, тооцоолуур</Text>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {([
            { key: 'types' as TabKey, label: '📋 Даатгалууд' },
            { key: 'calc' as TabKey, label: '🧮 Тооцоолуур' },
            { key: 'guide' as TabKey, label: '📝 Заавар' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'types' && renderTypes()}
        {activeTab === 'calc' && renderCalc()}
        {activeTab === 'guide' && renderGuide()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND.bg },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: BRAND.primary },
  subtitle: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 16,
    backgroundColor: '#e8ede2', borderRadius: 14, padding: 3 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabItemActive: {
    backgroundColor: AppColors.white,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',     elevation: 3 },
  tabText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: BRAND.primary, fontWeight: '700' },

  // Info box
  infoBox: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, alignItems: 'flex-start', gap: 8 },
  infoEmoji: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 13, color: BRAND.primary, lineHeight: 20 },

  // Card
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: AppColors.white,
    borderRadius: 16, padding: 16,
    boxShadow: '0px 1px 6px rgba(0,0,0,0.05)',     elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 28, marginTop: 2 },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19 },
  expandIcon: { fontSize: 12, color: AppColors.gray, marginTop: 4 },

  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardMetaRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  cardMetaLabel: { fontSize: 12, fontWeight: '700', color: BRAND.primary, width: 70 },
  cardMetaValue: { flex: 1, fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },

  detailsBox: { marginTop: 8, backgroundColor: '#fafafa', borderRadius: 10, padding: 12 },
  detailRow: { marginBottom: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: AppColors.black, marginBottom: 2 },
  detailValue: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },

  // Docs
  docList: { marginTop: 10 },
  docItem: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  docBullet: { fontSize: 14, color: BRAND.primaryLight, fontWeight: '700', marginTop: 1 },
  docText: { flex: 1, fontSize: 13, color: AppColors.grayDark, lineHeight: 19 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.primary, marginBottom: 10 },

  // Calendar
  calendarRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  calendarEmoji: { fontSize: 20 },
  calendarMonth: { fontSize: 13, fontWeight: '700', color: AppColors.black },
  calendarEvent: { fontSize: 12, color: AppColors.grayDark, marginTop: 1 },

  // Calculator
  calcHint: { fontSize: 13, color: AppColors.grayDark, marginBottom: 12, lineHeight: 19 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginBottom: 2 },
  inputHint: { fontSize: 11, color: AppColors.gray, marginBottom: 6 },
  calcRow: { flexDirection: 'row', gap: 12 },
  calcInput: {
    borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12,
    padding: 12, fontSize: 16, color: AppColors.black, backgroundColor: '#fafafa' },
  calcBtn: {
    backgroundColor: BRAND.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 14 },
  calcBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  calcSubtitle: { fontSize: 13, color: AppColors.grayDark, marginBottom: 10 },

  // Results
  resultBox: { backgroundColor: '#fafafa', borderRadius: 12, padding: 14 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  resultLabel: { fontSize: 13, color: AppColors.grayDark },
  resultValue: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  resultNote: { fontSize: 11, color: AppColors.gray, marginBottom: 4, marginLeft: 4 },
  divider: { height: 2, backgroundColor: BRAND.primary, marginVertical: 8, borderRadius: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: BRAND.primary },
  totalValue: { fontSize: 16, fontWeight: '800', color: BRAND.primary },

  // ROI
  roiBox: {
    marginTop: 12, backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, alignItems: 'center' },
  roiTitle: { fontSize: 13, fontWeight: '700', color: '#f57f17', marginBottom: 4 },
  roiText: { fontSize: 12, color: '#f57f17', textAlign: 'center' },
  roiHighlight: { fontSize: 24, fontWeight: '800', color: '#E65100', marginTop: 6 },

  // Examples
  exampleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  exampleLabel: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  exampleMeta: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  examplePremium: { fontSize: 13, fontWeight: '600', color: BRAND.primary },
  exampleComp: { fontSize: 12, color: '#2E7D32', marginTop: 2 },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND.primary,
    justifyContent: 'center', alignItems: 'center' },
  stepNumber: { fontSize: 14, fontWeight: '800', color: AppColors.white },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginBottom: 2 },
  stepDesc: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },

  // FAQ
  faqItem: {
    marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginBottom: 4 },
  faqAnswer: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19 } });
