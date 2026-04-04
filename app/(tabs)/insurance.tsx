import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { insuranceApi } from '@/services/api';

const BRAND = {
  primary: '#2d5016',
  primaryLight: '#4a7c28',
  bg: '#f5f7f0',
};

type TabKey = 'insurance' | 'livestock' | 'welfare' | 'docs' | 'calc';

function formatPrice(n: number): string {
  return '₮' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function InsuranceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('insurance');
  const [data, setData] = useState<any>(null);

  // Calculator
  const [calcIncome, setCalcIncome] = useState('500000');
  const [calcResult, setCalcResult] = useState<any>(null);

  // Expanded items
  const [expandedInsurance, setExpandedInsurance] = useState<number | null>(null);
  const [expandedLivestock, setExpandedLivestock] = useState<number | null>(null);
  const [expandedWelfare, setExpandedWelfare] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const result = await insuranceApi.getAll();
      setData(result);
      setCalcResult(result.default_calculation);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleCalc = async () => {
    const income = parseInt(calcIncome) || 500000;
    try {
      const result = await insuranceApi.calculate(income);
      setCalcResult(result);
    } catch {
      // use local calculation
      const total = Math.round(income * 0.115);
      setCalcResult({
        monthly_income: income,
        pension: Math.round(income * 0.07),
        benefit: Math.round(income * 0.01),
        accident: Math.round(income * 0.01),
        unemployment: Math.round(income * 0.005),
        health: Math.round(income * 0.02),
        total,
        percent: '11.5%',
        yearly: total * 12,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </SafeAreaView>
    );
  }

  const insuranceTypes = data?.insurance_types || [];
  const welfarePrograms = data?.welfare_programs || [];
  const documents = data?.documents || [];
  const contacts = data?.contacts || [];

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {([
        { key: 'insurance' as TabKey, label: '🏦 НД' },
        { key: 'livestock' as TabKey, label: '🐑 Малын' },
        { key: 'welfare' as TabKey, label: '🤝 Халамж' },
        { key: 'docs' as TabKey, label: '📄 Баримт' },
        { key: 'calc' as TabKey, label: '🧮 Тооцоо' },
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
  );

  // ─── Tab 1: Даатгал ───
  const renderInsurance = () => (
    <>
      <View style={styles.infoBox}>
        <Text style={styles.infoEmoji}>💡</Text>
        <Text style={styles.infoText}>
          Малчид нийгмийн даатгалд сайн дурын даатгуулагчаар хамрагдана. Нийт шимтгэл нь орлогын 11.5%.
        </Text>
      </View>

      {insuranceTypes.map((ins: any) => {
        const isExpanded = expandedInsurance === ins.id;
        return (
          <TouchableOpacity
            key={ins.id}
            style={styles.card}
            onPress={() => setExpandedInsurance(isExpanded ? null : ins.id)}
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
    </>
  );

  // ─── Tab 2: Малын даатгал ───
  const renderLivestockInsurance = () => {
    const livestockTypes = data?.livestock_insurance || [];
    const livestockDocs = data?.livestock_docs;
    return (
      <>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🐑</Text>
          <Text style={styles.infoText}>
            Малын даатгал нь зуд, ган, гамшгийн үед малын хорогдлын хохирлыг нөхөх зорилготой.
          </Text>
        </View>

        {livestockTypes.map((ins: any) => {
          const isExpanded = expandedLivestock === ins.id;
          return (
            <TouchableOpacity
              key={ins.id}
              style={styles.card}
              onPress={() => setExpandedLivestock(isExpanded ? null : ins.id)}
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
      </>
    );
  };

  // ─── Tab 3: Халамж ───
  const renderWelfare = () => (
    <>
      {welfarePrograms.map((prog: any) => {
        const isExpanded = expandedWelfare === prog.id;
        return (
          <TouchableOpacity
            key={prog.id}
            style={styles.card}
            onPress={() => setExpandedWelfare(isExpanded ? null : prog.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{prog.emoji}</Text>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardTitle}>{prog.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 2}>{prog.description}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>

            {isExpanded && (
              <View style={styles.cardBody}>
                {prog.items?.map((item: any, idx: number) => (
                  <View key={idx} style={styles.welfareItem}>
                    <Text style={styles.welfareTitle}>{item.title}</Text>
                    <Text style={styles.welfareDesc}>{item.description}</Text>
                    {item.amount && (
                      <View style={styles.welfareMetaRow}>
                        <Text style={styles.welfareMetaLabel}>Хэмжээ:</Text>
                        <Text style={styles.welfareMetaValue}>{item.amount}</Text>
                      </View>
                    )}
                    {item.where && (
                      <View style={styles.welfareMetaRow}>
                        <Text style={styles.welfareMetaLabel}>Хаана:</Text>
                        <Text style={styles.welfareMetaValue}>{item.where}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── Tab 3: Бичиг баримт ───
  const renderDocs = () => (
    <>
      {documents.map((doc: any) => (
        <View key={doc.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{doc.emoji}</Text>
            <Text style={[styles.cardTitle, { flex: 1 }]}>{doc.title}</Text>
          </View>
          <View style={styles.docList}>
            {doc.items?.map((item: string, idx: number) => (
              <View key={idx} style={styles.docItem}>
                <Text style={styles.docBullet}>✓</Text>
                <Text style={styles.docText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Холбоо барих */}
      <View style={[styles.card, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>📞 Холбоо барих</Text>
        {contacts.map((c: any, idx: number) => (
          <TouchableOpacity
            key={idx}
            style={styles.contactRow}
            onPress={() => {
              if (c.phone && /^\d/.test(c.phone)) {
                Linking.openURL(`tel:${c.phone}`);
              }
            }}
          >
            <Text style={styles.contactEmoji}>{c.emoji}</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{c.title}</Text>
              <Text style={styles.contactDesc}>{c.description}</Text>
            </View>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // ─── Tab 4: Тооцоолуур ───
  const renderCalc = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🧮 Шимтгэлийн тооцоолуур</Text>
        <Text style={styles.calcHint}>
          Сарын орлогоо оруулбал нийгмийн даатгалын шимтгэлийг тооцоолно.
        </Text>

        <Text style={styles.inputLabel}>Сарын орлого (₮)</Text>
        <View style={styles.calcInputRow}>
          <TextInput
            style={styles.calcInput}
            keyboardType="numeric"
            value={calcIncome}
            onChangeText={setCalcIncome}
            placeholder="500000"
            placeholderTextColor={AppColors.gray}
          />
          <TouchableOpacity style={styles.calcBtn} onPress={handleCalc}>
            <Text style={styles.calcBtnText}>Тооцоолох</Text>
          </TouchableOpacity>
        </View>
      </View>

      {calcResult && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Тооцооны үр дүн</Text>
          <Text style={styles.calcSubtitle}>
            Сарын орлого: {formatPrice(calcResult.monthly_income)}
          </Text>

          <View style={styles.calcResultBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>🏦 Тэтгэврийн (7%)</Text>
              <Text style={styles.calcValue}>{formatPrice(calcResult.pension)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>💊 Тэтгэмжийн (1%)</Text>
              <Text style={styles.calcValue}>{formatPrice(calcResult.benefit)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>⚠️ ҮОМШӨ (1%)</Text>
              <Text style={styles.calcValue}>{formatPrice(calcResult.accident)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>📋 Ажилгүйдлийн (0.5%)</Text>
              <Text style={styles.calcValue}>{formatPrice(calcResult.unemployment)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>🏥 ЭМД (2%)</Text>
              <Text style={styles.calcValue}>{formatPrice(calcResult.health)}</Text>
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalLabel}>Сарын нийт ({calcResult.percent})</Text>
              <Text style={styles.calcTotalValue}>{formatPrice(calcResult.total)}</Text>
            </View>
            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalLabel}>Жилийн нийт</Text>
              <Text style={[styles.calcTotalValue, { color: AppColors.danger }]}>
                {formatPrice(calcResult.yearly)}
              </Text>
            </View>
          </View>

          <View style={styles.calcTipBox}>
            <Text style={styles.calcTipText}>
              💡 Шимтгэлийг сар бүр эсвэл улирал/жилээр нэг дор төлж болно. Жилээр төлвөл нийт {formatPrice(calcResult.yearly)}.
            </Text>
          </View>
        </View>
      )}

      {/* Хурдан тооцоо */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Түгээмэл орлогын түвшин</Text>
        {[300000, 500000, 800000, 1000000, 1500000].map(income => {
          const total = Math.round(income * 0.115);
          return (
            <TouchableOpacity
              key={income}
              style={styles.quickCalcRow}
              onPress={() => { setCalcIncome(String(income)); handleCalc(); }}
            >
              <Text style={styles.quickCalcIncome}>{formatPrice(income)}/сар</Text>
              <Text style={styles.quickCalcArrow}>→</Text>
              <Text style={styles.quickCalcTotal}>{formatPrice(total)}/сар</Text>
            </TouchableOpacity>
          );
        })}
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
          <Text style={styles.title}>🛡️ Даатгал & Халамж</Text>
          <Text style={styles.subtitle}>Малчны нийгмийн хамгаалал</Text>
        </View>

        {renderTabBar()}

        {activeTab === 'insurance' && renderInsurance()}
        {activeTab === 'livestock' && renderLivestockInsurance()}
        {activeTab === 'welfare' && renderWelfare()}
        {activeTab === 'docs' && renderDocs()}
        {activeTab === 'calc' && renderCalc()}

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
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#e8ede2',
    borderRadius: 14,
    padding: 3,
  },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabItemActive: {
    backgroundColor: AppColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: BRAND.primary, fontWeight: '700' },

  // Info box
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoEmoji: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 13, color: BRAND.primary, lineHeight: 20 },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 28, marginTop: 2 },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: AppColors.grayDark, lineHeight: 19 },
  expandIcon: { fontSize: 12, color: AppColors.gray, marginTop: 4 },

  // Card body
  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardMetaRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  cardMetaLabel: { fontSize: 12, fontWeight: '700', color: BRAND.primary, width: 70 },
  cardMetaValue: { flex: 1, fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },

  // Details
  detailsBox: { marginTop: 8, backgroundColor: '#fafafa', borderRadius: 10, padding: 12 },
  detailRow: { marginBottom: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: AppColors.black, marginBottom: 2 },
  detailValue: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18 },

  // Welfare
  welfareItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  welfareTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginBottom: 4 },
  welfareDesc: { fontSize: 12, color: AppColors.grayDark, lineHeight: 18, marginBottom: 6 },
  welfareMetaRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  welfareMetaLabel: { fontSize: 11, fontWeight: '700', color: BRAND.primaryLight },
  welfareMetaValue: { flex: 1, fontSize: 11, color: AppColors.grayDark },

  // Docs
  docList: { marginTop: 10 },
  docItem: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  docBullet: { fontSize: 14, color: BRAND.primaryLight, fontWeight: '700', marginTop: 1 },
  docText: { flex: 1, fontSize: 13, color: AppColors.grayDark, lineHeight: 19 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.primary, marginBottom: 10 },

  // Contacts
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  contactEmoji: { fontSize: 22 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  contactDesc: { fontSize: 11, color: AppColors.gray, marginTop: 1 },
  contactPhone: { fontSize: 13, fontWeight: '700', color: BRAND.primary },

  // Calculator
  calcHint: { fontSize: 13, color: AppColors.grayDark, marginBottom: 12, lineHeight: 19 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6 },
  calcInputRow: { flexDirection: 'row', gap: 8 },
  calcInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: AppColors.black,
    backgroundColor: '#fafafa',
  },
  calcBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  calcBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },

  calcSubtitle: { fontSize: 13, color: AppColors.grayDark, marginBottom: 10 },
  calcResultBox: { backgroundColor: '#fafafa', borderRadius: 12, padding: 14 },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calcLabel: { fontSize: 13, color: AppColors.grayDark },
  calcValue: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  calcDivider: { height: 2, backgroundColor: BRAND.primary, marginVertical: 8, borderRadius: 1 },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcTotalLabel: { fontSize: 14, fontWeight: '700', color: BRAND.primary },
  calcTotalValue: { fontSize: 16, fontWeight: '800', color: BRAND.primary },

  calcTipBox: {
    marginTop: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 12,
  },
  calcTipText: { fontSize: 12, color: '#f57f17', lineHeight: 18 },

  // Quick calc
  quickCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickCalcIncome: { flex: 1, fontSize: 14, fontWeight: '600', color: AppColors.black },
  quickCalcArrow: { fontSize: 14, color: AppColors.gray, marginHorizontal: 8 },
  quickCalcTotal: { fontSize: 14, fontWeight: '700', color: BRAND.primary },
});
