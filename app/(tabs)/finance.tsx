import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { financeApi } from '@/services/api';

// ───────── Constants ─────────

const BRAND = {
  primary: '#2d5016',
  primaryLight: '#4a7c28',
  bg: '#f5f7f0',
};

const MONTHS_MN = [
  'I сар', 'II сар', 'III сар', 'IV сар', 'V сар', 'VI сар',
  'VII сар', 'VIII сар', 'IX сар', 'X сар', 'XI сар', 'XII сар',
];

const MONTH_NAMES = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

const categories = {
  income: [
    { key: 'sale', label: 'Мал борлуулалт', emoji: '🐑' },
    { key: 'dairy', label: 'Сүү', emoji: '🥛' },
    { key: 'wool', label: 'Ноос/Ноолуур', emoji: '🧶' },
    { key: 'subsidy', label: 'Татаас/Тэтгэлэг', emoji: '🏦' },
    { key: 'other_in', label: 'Бусад', emoji: '💰' },
  ],
  expense: [
    { key: 'feed', label: 'Тэжээл/Өвс', emoji: '🌾' },
    { key: 'medicine', label: 'Эм/Эмчилгээ', emoji: '💊' },
    { key: 'transport', label: 'Тээвэр', emoji: '🚚' },
    { key: 'equipment', label: 'Тоног төхөөрөмж', emoji: '🔧' },
    { key: 'labor', label: 'Хөдөлмөр', emoji: '👷' },
    { key: 'other_ex', label: 'Бусад', emoji: '💰' },
  ],
};

type TabKey = 'overview' | 'records' | 'report';
type RecordType = 'income' | 'expense';
type FilterType = 'all' | 'income' | 'expense';

// ───────── Helpers ─────────

function formatPrice(n: number): string {
  if (n < 0) return '-₮' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '₮' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPriceShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'сая';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'мян';
  return n.toString();
}

function getCatInfo(key: string) {
  const all = [...categories.income, ...categories.expense];
  return all.find(c => c.key === key) || { label: key, emoji: '💰' };
}

function getMonthFromDate(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('-');
  return parts.length >= 2 ? parseInt(parts[1], 10) : 0;
}

function getYearFromDate(dateStr: string): number {
  if (!dateStr) return new Date().getFullYear();
  const parts = dateStr.split('-');
  return parts.length >= 1 ? parseInt(parts[0], 10) : new Date().getFullYear();
}

function getDateStr(rec: any): string {
  const d = rec.record_date || rec.created_at || '';
  return d.split(' ')[0] || d.split('T')[0] || '';
}

// ───────── Component ─────────

export default function FinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit: 0 });

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordType, setRecordType] = useState<RecordType>('income');
  const [selectedCat, setSelectedCat] = useState('sale');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Records tab filters
  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 = all
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Report tab
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // Profitability
  const [profitability, setProfitability] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [recordsRes, summaryRes, profitRes] = await Promise.allSettled([
        financeApi.getAll(),
        financeApi.getSummary(),
        financeApi.getProfitability(),
      ]);
      if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (profitRes.status === 'fulfilled') setProfitability(profitRes.value);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleSave = async () => {
    const num = parseInt(amount);
    if (!num || num <= 0) { Alert.alert('Алдаа', 'Дүн оруулна уу'); return; }
    try {
      if (editingRecord) {
        await financeApi.update(editingRecord.id, {
          type: recordType,
          category: selectedCat,
          amount: num,
          note: note.trim(),
        });
      } else {
        await financeApi.add({
          type: recordType,
          category: selectedCat,
          amount: num,
          note: note.trim(),
        });
      }
      setShowModal(false);
      setEditingRecord(null);
      setAmount('');
      setNote('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Бүртгэхэд алдаа гарлаа');
    }
  };

  const handleEdit = (rec: any) => {
    setEditingRecord(rec);
    setRecordType(rec.type);
    setSelectedCat(rec.category || (rec.type === 'income' ? 'sale' : 'feed'));
    setAmount(String(rec.amount));
    setNote(rec.note || '');
    setShowModal(true);
  };

  const handleDelete = (rec: any) => {
    const cat = getCatInfo(rec.category);
    Alert.alert(
      'Устгах',
      `${cat.emoji} ${cat.label} - ${formatPrice(rec.amount)} бүртгэлийг устгах уу?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Устгах', style: 'destructive',
          onPress: async () => {
            try {
              await financeApi.delete(rec.id);
              loadData();
            } catch {
              Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
            }
          },
        },
      ]
    );
  };

  const openAddModal = (type: RecordType) => {
    setEditingRecord(null);
    switchType(type);
    setAmount('');
    setNote('');
    setShowModal(true);
  };

  const switchType = (type: RecordType) => {
    setRecordType(type);
    setSelectedCat(type === 'income' ? 'sale' : 'feed');
  };

  // ───────── Derived data ─────────

  // Monthly breakdown for all records
  const monthlyData = useMemo(() => {
    const months: Record<number, { income: number; expense: number }> = {};
    for (let m = 1; m <= 12; m++) months[m] = { income: 0, expense: 0 };
    records.forEach(rec => {
      const dateStr = getDateStr(rec);
      const month = getMonthFromDate(dateStr);
      if (month >= 1 && month <= 12) {
        if (rec.type === 'income') months[month].income += rec.amount || 0;
        else months[month].expense += rec.amount || 0;
      }
    });
    return months;
  }, [records]);

  // Category breakdown for expenses
  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    records.forEach(rec => {
      if (rec.type === 'expense') {
        const key = rec.category || 'other_ex';
        cats[key] = (cats[key] || 0) + (rec.amount || 0);
      }
    });
    return Object.entries(cats)
      .map(([key, total]) => ({ key, total, ...getCatInfo(key) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [records]);

  // Income by category for livestock yield
  const incomeByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    records.forEach(rec => {
      if (rec.type === 'income') {
        const key = rec.category || 'other_in';
        cats[key] = (cats[key] || 0) + (rec.amount || 0);
      }
    });
    return Object.entries(cats)
      .map(([key, total]) => ({ key, total, ...getCatInfo(key) }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  // Last 6 months trend
  const last6Months = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const result: { month: number; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m <= 0) m += 12;
      result.push({
        month: m,
        label: MONTHS_MN[m - 1],
        income: monthlyData[m]?.income || 0,
        expense: monthlyData[m]?.expense || 0,
      });
    }
    return result;
  }, [monthlyData]);

  // Filtered records for Records tab
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      if (filterType !== 'all' && rec.type !== filterType) return false;
      if (filterMonth > 0) {
        const dateStr = getDateStr(rec);
        const m = getMonthFromDate(dateStr);
        if (m !== filterMonth) return false;
      }
      return true;
    });
  }, [records, filterType, filterMonth]);

  // Report year data
  const reportData = useMemo(() => {
    const yearRecords = records.filter(rec => {
      const dateStr = getDateStr(rec);
      return getYearFromDate(dateStr) === reportYear;
    });

    const monthlyProfit: { month: number; income: number; expense: number; profit: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const mRecs = yearRecords.filter(r => getMonthFromDate(getDateStr(r)) === m);
      const inc = mRecs.filter(r => r.type === 'income').reduce((s, r) => s + (r.amount || 0), 0);
      const exp = mRecs.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amount || 0), 0);
      monthlyProfit.push({ month: m, income: inc, expense: exp, profit: inc - exp });
    }

    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};
    yearRecords.forEach(rec => {
      const key = rec.category || 'other';
      if (rec.type === 'income') incomeByCat[key] = (incomeByCat[key] || 0) + (rec.amount || 0);
      else expenseByCat[key] = (expenseByCat[key] || 0) + (rec.amount || 0);
    });

    const totalInc = yearRecords.filter(r => r.type === 'income').reduce((s, r) => s + (r.amount || 0), 0);
    const totalExp = yearRecords.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amount || 0), 0);

    return { monthlyProfit, incomeByCat, expenseByCat, totalInc, totalExp, profit: totalInc - totalExp };
  }, [records, reportYear]);

  // Available years from records
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    records.forEach(rec => {
      const y = getYearFromDate(getDateStr(rec));
      if (y) years.add(y);
    });
    const current = new Date().getFullYear();
    years.add(current);
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  // ───────── Loading ─────────

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </SafeAreaView>
    );
  }

  // ───────── Render helpers ─────────

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {([
        { key: 'overview' as TabKey, label: '📊 Тойм' },
        { key: 'records' as TabKey, label: '📋 Бүртгэл' },
        { key: 'report' as TabKey, label: '📈 Тайлан' },
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

  // ─── Tab 1: Overview ───

  const renderOverview = () => {
    const totalExpense = summary.total_expense || 0;
    const maxBar = Math.max(...last6Months.map(m => Math.max(m.income, m.expense)), 1);

    return (
      <>
        {/* Profit Card */}
        <View style={[styles.bigProfitCard, {
          backgroundColor: summary.profit >= 0 ? '#e8f5e9' : '#ffebee',
          borderColor: summary.profit >= 0 ? BRAND.primaryLight : AppColors.danger,
        }]}>
          <Text style={styles.bigProfitTitle}>💰 Нийт ашиг/алдагдал</Text>
          <Text style={[styles.bigProfitAmount, {
            color: summary.profit >= 0 ? BRAND.primary : AppColors.danger,
          }]}>
            {summary.profit >= 0 ? '+' : ''}{formatPrice(summary.profit)}
          </Text>
          <View style={styles.profitBreakdown}>
            <View style={styles.profitBreakdownItem}>
              <View style={[styles.profitDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.profitBreakdownLabel}>Орлого</Text>
              <Text style={[styles.profitBreakdownVal, { color: AppColors.success }]}>
                {formatPrice(summary.total_income)}
              </Text>
            </View>
            <View style={styles.profitBreakdownItem}>
              <View style={[styles.profitDot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.profitBreakdownLabel}>Зардал</Text>
              <Text style={[styles.profitBreakdownVal, { color: AppColors.danger }]}>
                {formatPrice(summary.total_expense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>📊 Сарын чиг хандлага (сүүлийн 6 сар)</Text>
          <View style={styles.trendContainer}>
            {last6Months.map((m, idx) => (
              <View key={idx} style={styles.trendColumn}>
                <View style={styles.trendBars}>
                  <View style={[styles.trendBar, styles.trendBarIncome, {
                    height: Math.max((m.income / maxBar) * 80, 2),
                  }]} />
                  <View style={[styles.trendBar, styles.trendBarExpense, {
                    height: Math.max((m.expense / maxBar) * 80, 2),
                  }]} />
                </View>
                <Text style={styles.trendLabel}>{m.label}</Text>
                <Text style={styles.trendValue}>{formatPriceShort(m.income)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BRAND.primaryLight }]} />
              <Text style={styles.legendText}>Орлого</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.legendText}>Зардал</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        {expenseByCategory.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>📦 Зардлын ангилал (Топ 5)</Text>
            {expenseByCategory.map((cat, idx) => {
              const pct = totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0;
              return (
                <View key={cat.key} style={styles.catBreakdownRow}>
                  <Text style={styles.catBreakdownEmoji}>{cat.emoji}</Text>
                  <View style={styles.catBreakdownInfo}>
                    <View style={styles.catBreakdownHeader}>
                      <Text style={styles.catBreakdownLabel}>{cat.label}</Text>
                      <Text style={styles.catBreakdownAmount}>{formatPrice(cat.total)}</Text>
                    </View>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: idx === 0 ? AppColors.danger : idx < 3 ? AppColors.warning : AppColors.gray,
                      }]} />
                    </View>
                    <Text style={styles.catPctText}>{pct.toFixed(1)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Livestock Yield */}
        {incomeByCategory.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>🐄 Орлогын бүтэц</Text>
            {incomeByCategory.map(cat => {
              const pct = summary.total_income > 0 ? (cat.total / summary.total_income) * 100 : 0;
              return (
                <View key={cat.key} style={styles.yieldRow}>
                  <Text style={styles.yieldEmoji}>{cat.emoji}</Text>
                  <View style={styles.yieldInfo}>
                    <Text style={styles.yieldLabel}>{cat.label}</Text>
                    <Text style={styles.yieldPct}>{pct.toFixed(1)}%</Text>
                  </View>
                  <Text style={[styles.yieldAmount, { color: BRAND.primary }]}>{formatPrice(cat.total)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </>
    );
  };

  // ─── Tab 2: Records ───

  const renderRecords = () => (
    <>
      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: BRAND.primaryLight }]}
          onPress={() => openAddModal('income')}
        >
          <Text style={styles.actionBtnText}>+ Орлого нэмэх</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AppColors.danger }]}
          onPress={() => openAddModal('expense')}
        >
          <Text style={styles.actionBtnText}>+ Зардал нэмэх</Text>
        </TouchableOpacity>
      </View>

      {/* Type filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {([
            { key: 'all' as FilterType, label: 'Бүгд' },
            { key: 'income' as FilterType, label: '📈 Орлого' },
            { key: 'expense' as FilterType, label: '📉 Зардал' },
          ]).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
              onPress={() => setFilterType(f.key)}
            >
              <Text style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Month filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.monthChip, filterMonth === 0 && styles.monthChipActive]}
            onPress={() => setFilterMonth(0)}
          >
            <Text style={[styles.monthChipText, filterMonth === 0 && styles.monthChipTextActive]}>
              Бүх сар
            </Text>
          </TouchableOpacity>
          {MONTH_NAMES.map((name, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.monthChip, filterMonth === idx + 1 && styles.monthChipActive]}
              onPress={() => setFilterMonth(idx + 1)}
            >
              <Text style={[styles.monthChipText, filterMonth === idx + 1 && styles.monthChipTextActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Count */}
      <View style={styles.recordCountRow}>
        <Text style={styles.recordCountText}>
          Нийт: {filteredRecords.length} бүртгэл
        </Text>
        <Text style={styles.recordHintText}>
          Засах: товш | Устгах: удаан дар
        </Text>
      </View>

      {/* Records list */}
      <View style={styles.section}>
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Бүртгэл байхгүй байна</Text>
          </View>
        ) : (
          filteredRecords.map((rec: any) => {
            const cat = getCatInfo(rec.category);
            const isIncome = rec.type === 'income';
            const dateStr = getDateStr(rec);
            return (
              <TouchableOpacity key={rec.id} style={styles.recordItem} onPress={() => handleEdit(rec)} onLongPress={() => handleDelete(rec)}>
                <View style={[styles.recordEmojiBox, {
                  backgroundColor: isIncome ? '#e8f5e9' : '#ffebee',
                }]}>
                  <Text style={styles.recordEmoji}>{cat.emoji}</Text>
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordCat}>{cat.label}</Text>
                  {rec.note ? <Text style={styles.recordNote} numberOfLines={1}>{rec.note}</Text> : null}
                  <Text style={styles.recordDate}>{dateStr}</Text>
                </View>
                <View style={styles.recordRight}>
                  <Text style={[styles.recordAmount, { color: isIncome ? BRAND.primary : AppColors.danger }]}>
                    {isIncome ? '+' : '-'}{formatPrice(rec.amount)}
                  </Text>
                  <View style={styles.recordActions}>
                    <TouchableOpacity onPress={() => handleEdit(rec)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.recordActionEdit}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(rec)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.recordActionDelete}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </>
  );

  // ─── Tab 3: Report ───

  const renderReport = () => {
    const { monthlyProfit, incomeByCat, expenseByCat, totalInc, totalExp, profit } = reportData;
    const totalAnimals = profitability?.total_head || 0;
    const perAnimalIncome = totalAnimals > 0 ? Math.round(totalInc / totalAnimals) : 0;
    const perAnimalExpense = totalAnimals > 0 ? Math.round(totalExp / totalAnimals) : 0;
    const perAnimalProfit = totalAnimals > 0 ? Math.round(profit / totalAnimals) : 0;

    const incomeCatEntries = Object.entries(incomeByCat)
      .map(([key, total]) => ({ ...getCatInfo(key), total }))
      .sort((a, b) => b.total - a.total);
    const expenseCatEntries = Object.entries(expenseByCat)
      .map(([key, total]) => ({ ...getCatInfo(key), total }))
      .sort((a, b) => b.total - a.total);

    return (
      <>
        {/* Year selector */}
        <View style={styles.yearSelector}>
          <Text style={styles.yearLabel}>📅 Тайлант жил:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
            {availableYears.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearChip, reportYear === y && styles.yearChipActive]}
                onPress={() => setReportYear(y)}
              >
                <Text style={[styles.yearChipText, reportYear === y && styles.yearChipTextActive]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Year Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>📊 {reportYear} оны нийт дүн</Text>
          <View style={styles.reportSummaryRow}>
            <View style={[styles.reportSummaryBox, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.reportSummaryLabel}>Нийт орлого</Text>
              <Text style={[styles.reportSummaryVal, { color: BRAND.primary }]}>{formatPrice(totalInc)}</Text>
            </View>
            <View style={[styles.reportSummaryBox, { backgroundColor: '#ffebee' }]}>
              <Text style={styles.reportSummaryLabel}>Нийт зардал</Text>
              <Text style={[styles.reportSummaryVal, { color: AppColors.danger }]}>{formatPrice(totalExp)}</Text>
            </View>
          </View>
          <View style={[styles.reportProfitBox, {
            backgroundColor: profit >= 0 ? '#e8f5e9' : '#ffebee',
          }]}>
            <Text style={styles.reportSummaryLabel}>Цэвэр ашиг</Text>
            <Text style={[styles.reportProfitVal, {
              color: profit >= 0 ? BRAND.primary : AppColors.danger,
            }]}>
              {profit >= 0 ? '+' : ''}{formatPrice(profit)}
            </Text>
          </View>
        </View>

        {/* Income by category */}
        {incomeCatEntries.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>📈 Орлогын ангилал</Text>
            {incomeCatEntries.map(cat => (
              <View key={cat.label} style={styles.reportCatRow}>
                <Text style={styles.reportCatEmoji}>{cat.emoji}</Text>
                <Text style={styles.reportCatLabel}>{cat.label}</Text>
                <Text style={[styles.reportCatVal, { color: BRAND.primary }]}>{formatPrice(cat.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expense by category */}
        {expenseCatEntries.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>📉 Зардлын ангилал</Text>
            {expenseCatEntries.map(cat => (
              <View key={cat.label} style={styles.reportCatRow}>
                <Text style={styles.reportCatEmoji}>{cat.emoji}</Text>
                <Text style={styles.reportCatLabel}>{cat.label}</Text>
                <Text style={[styles.reportCatVal, { color: AppColors.danger }]}>{formatPrice(cat.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Monthly P&L table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>📋 Сарын ашиг/алдагдал</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Сар</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Орлого</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Зардал</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Ашиг</Text>
          </View>
          {monthlyProfit.map(row => {
            const hasData = row.income > 0 || row.expense > 0;
            return (
              <View key={row.month} style={[styles.tableRow, !hasData && styles.tableRowEmpty]}>
                <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '600' }]}>
                  {MONTH_NAMES[row.month - 1]}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: BRAND.primary }]}>
                  {hasData ? formatPriceShort(row.income) : '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: AppColors.danger }]}>
                  {hasData ? formatPriceShort(row.expense) : '-'}
                </Text>
                <Text style={[styles.tableCell, {
                  flex: 1,
                  fontWeight: '700',
                  color: row.profit >= 0 ? BRAND.primary : AppColors.danger,
                }]}>
                  {hasData ? (row.profit >= 0 ? '+' : '') + formatPriceShort(row.profit) : '-'}
                </Text>
              </View>
            );
          })}
          {/* Totals row */}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.tableTotalCell, { flex: 1.2 }]}>Нийт</Text>
            <Text style={[styles.tableTotalCell, { flex: 1, color: BRAND.primary }]}>
              {formatPriceShort(totalInc)}
            </Text>
            <Text style={[styles.tableTotalCell, { flex: 1, color: AppColors.danger }]}>
              {formatPriceShort(totalExp)}
            </Text>
            <Text style={[styles.tableTotalCell, {
              flex: 1,
              color: profit >= 0 ? BRAND.primary : AppColors.danger,
            }]}>
              {profit >= 0 ? '+' : ''}{formatPriceShort(profit)}
            </Text>
          </View>
        </View>

        {/* Per-animal profitability */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🐄 Ашиг шимийн тооцоо</Text>
          <Text style={styles.perAnimalNote}>
            {totalAnimals > 0
              ? `* Нийт ${totalAnimals} толгой малын бүртгэлд суурилсан тооцоо`
              : '* Малын бүртгэл оруулснаар нэг малд ноогдох тооцоо гарна'}
          </Text>
          <View style={styles.perAnimalGrid}>
            <View style={[styles.perAnimalBox, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.perAnimalLabel}>Нэг малд ноогдох орлого</Text>
              <Text style={[styles.perAnimalVal, { color: BRAND.primary }]}>{formatPrice(perAnimalIncome)}</Text>
            </View>
            <View style={[styles.perAnimalBox, { backgroundColor: '#ffebee' }]}>
              <Text style={styles.perAnimalLabel}>Нэг малд ноогдох зардал</Text>
              <Text style={[styles.perAnimalVal, { color: AppColors.danger }]}>{formatPrice(perAnimalExpense)}</Text>
            </View>
          </View>
          <View style={[styles.perAnimalBoxWide, {
            backgroundColor: perAnimalProfit >= 0 ? '#e8f5e9' : '#ffebee',
            borderColor: perAnimalProfit >= 0 ? BRAND.primaryLight : AppColors.danger,
          }]}>
            <Text style={styles.perAnimalLabel}>Цэвэр ашиг / мал</Text>
            <Text style={[styles.perAnimalValBig, {
              color: perAnimalProfit >= 0 ? BRAND.primary : AppColors.danger,
            }]}>
              {perAnimalProfit >= 0 ? '+' : ''}{formatPrice(perAnimalProfit)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  // ───────── Main render ─────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💰 Санхүү</Text>
          <Text style={styles.subtitle}>Орлого, зардал, ашгийн тооцоо</Text>
        </View>

        {renderTabBar()}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'records' && renderRecords()}
        {activeTab === 'report' && renderReport()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Add Record Modal ─── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingRecord
                ? (recordType === 'income' ? '📈 Орлого засах' : '📉 Зардал засах')
                : (recordType === 'income' ? '📈 Орлого нэмэх' : '📉 Зардал нэмэх')}
            </Text>

            {/* Type toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, recordType === 'income' && styles.toggleIncome]}
                onPress={() => switchType('income')}
              >
                <Text style={[styles.toggleText, recordType === 'income' && styles.toggleTextActive]}>
                  📈 Орлого
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, recordType === 'expense' && styles.toggleExpense]}
                onPress={() => switchType('expense')}
              >
                <Text style={[styles.toggleText, recordType === 'expense' && styles.toggleTextActive]}>
                  📉 Зардал
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Ангилал</Text>
            <View style={styles.catSelector}>
              {categories[recordType].map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catBtn, selectedCat === cat.key && styles.catBtnActive]}
                  onPress={() => setSelectedCat(cat.key)}
                >
                  <Text style={styles.catBtnEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catBtnLabel, selectedCat === cat.key && styles.catBtnLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Дүн (₮)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="Жишээ: 500000"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.modalLabel}>Тэмдэглэл</Text>
            <TextInput
              style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Нэмэлт тайлбар..."
              placeholderTextColor={AppColors.gray}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setEditingRecord(null); }}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, {
                  backgroundColor: recordType === 'income' ? BRAND.primaryLight : AppColors.danger,
                }]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>{editingRecord ? '✓ Хадгалах' : '✓ Бүртгэх'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ───────── Styles ─────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND.bg },

  // Header
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
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: AppColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: BRAND.primary, fontWeight: '700' },

  // ─── Overview ───
  bigProfitCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  bigProfitTitle: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  bigProfitAmount: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  profitBreakdown: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  profitBreakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profitDot: { width: 8, height: 8, borderRadius: 4 },
  profitBreakdownLabel: { fontSize: 13, color: AppColors.grayDark },
  profitBreakdownVal: { fontSize: 14, fontWeight: '700' },

  // Section card
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionCardTitle: { fontSize: 16, fontWeight: '700', color: BRAND.primary, marginBottom: 12 },

  // Trend chart
  trendContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  trendColumn: { alignItems: 'center', flex: 1 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: 4 },
  trendBar: { width: 12, borderRadius: 4 },
  trendBarIncome: { backgroundColor: BRAND.primaryLight },
  trendBarExpense: { backgroundColor: '#ef9a9a' },
  trendLabel: { fontSize: 9, color: AppColors.grayDark, marginTop: 2 },
  trendValue: { fontSize: 8, color: AppColors.gray },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: AppColors.grayDark },

  // Category breakdown
  catBreakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catBreakdownEmoji: { fontSize: 24, marginRight: 10, width: 32, textAlign: 'center' },
  catBreakdownInfo: { flex: 1 },
  catBreakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catBreakdownLabel: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  catBreakdownAmount: { fontSize: 13, fontWeight: '700', color: AppColors.grayDark },
  catBarBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 },
  catBarFill: { height: 6, borderRadius: 3 },
  catPctText: { fontSize: 10, color: AppColors.gray, marginTop: 2 },

  // Yield
  yieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  yieldEmoji: { fontSize: 22, marginRight: 10, width: 32, textAlign: 'center' },
  yieldInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  yieldLabel: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  yieldPct: { fontSize: 12, color: AppColors.gray, fontWeight: '500' },
  yieldAmount: { fontSize: 14, fontWeight: '700' },

  // ─── Records ───
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },

  filterSection: { paddingHorizontal: 16, marginBottom: 8 },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8ede2',
  },
  filterChipActive: { backgroundColor: BRAND.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  filterChipTextActive: { color: AppColors.white },

  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8ede2',
  },
  monthChipActive: { backgroundColor: BRAND.primaryLight },
  monthChipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  monthChipTextActive: { color: AppColors.white },

  recordCountRow: { paddingHorizontal: 20, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordCountText: { fontSize: 12, color: AppColors.gray, fontWeight: '500' },
  recordHintText: { fontSize: 10, color: AppColors.gray, fontStyle: 'italic' },

  section: { paddingHorizontal: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic' },

  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recordEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordEmoji: { fontSize: 22 },
  recordInfo: { flex: 1 },
  recordCat: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  recordNote: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  recordDate: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  recordAmount: { fontSize: 15, fontWeight: '800' },
  recordActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  recordActionEdit: { fontSize: 14 },
  recordActionDelete: { fontSize: 14 },

  // ─── Report ───
  yearSelector: { paddingHorizontal: 16, marginBottom: 12 },
  yearLabel: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6 },
  yearRow: { gap: 8 },
  yearChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8ede2',
  },
  yearChipActive: { backgroundColor: BRAND.primary },
  yearChipText: { fontSize: 14, fontWeight: '700', color: AppColors.grayDark },
  yearChipTextActive: { color: AppColors.white },

  reportSummaryRow: { flexDirection: 'row', gap: 10 },
  reportSummaryBox: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  reportSummaryLabel: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  reportSummaryVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  reportProfitBox: {
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  reportProfitVal: { fontSize: 22, fontWeight: '900', marginTop: 4 },

  reportCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  reportCatEmoji: { fontSize: 20, marginRight: 8, width: 28, textAlign: 'center' },
  reportCatLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.black },
  reportCatVal: { fontSize: 14, fontWeight: '700' },

  // Monthly table
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: BRAND.primary,
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: BRAND.primary, textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEmpty: { opacity: 0.4 },
  tableCell: { fontSize: 12, color: AppColors.black, textAlign: 'center' },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND.primary,
    marginTop: 4,
  },
  tableTotalCell: { fontSize: 13, fontWeight: '800', textAlign: 'center' },

  // Per animal
  perAnimalNote: { fontSize: 11, color: AppColors.gray, fontStyle: 'italic', marginBottom: 10 },
  perAnimalGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  perAnimalBox: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  perAnimalLabel: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark, textAlign: 'center' },
  perAnimalVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  perAnimalBoxWide: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  perAnimalValBig: { fontSize: 24, fontWeight: '900', marginTop: 4 },

  // ─── Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.grayMedium,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: BRAND.primary, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
  },
  toggleIncome: { borderColor: BRAND.primaryLight, backgroundColor: '#e8f5e9' },
  toggleExpense: { borderColor: AppColors.danger, backgroundColor: '#ffebee' },
  toggleText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  toggleTextActive: { color: AppColors.black },
  modalLabel: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6, marginTop: 12 },
  catSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
  },
  catBtnActive: { borderColor: BRAND.primary, backgroundColor: '#e8f5e9' },
  catBtnEmoji: { fontSize: 18 },
  catBtnLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 2 },
  catBtnLabelActive: { color: BRAND.primary, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: AppColors.black,
    backgroundColor: '#fafafa',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.white },
});
