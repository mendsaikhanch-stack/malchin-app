import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { financeApi } from '@/services/api';

const categories = {
  income: [
    { key: 'sale', label: 'Мал борлуулалт', emoji: '\uD83D\uDC11' },
    { key: 'dairy', label: 'Сүү, цагаан идээ', emoji: '\uD83E\uDD5B' },
    { key: 'wool', label: 'Ноос, ноолуур', emoji: '\uD83E\uDDF6' },
    { key: 'subsidy', label: 'Татаас, тэтгэлэг', emoji: '\uD83C\uDFE6' },
    { key: 'other_in', label: 'Бусад орлого', emoji: '\uD83D\uDCB5' },
  ],
  expense: [
    { key: 'feed', label: 'Тэжээл', emoji: '\uD83C\uDF3E' },
    { key: 'medicine', label: 'Эм, вакцин', emoji: '\uD83D\uDC8A' },
    { key: 'transport', label: 'Тээвэр', emoji: '\uD83D\uDE9B' },
    { key: 'equipment', label: 'Тоног төхөөрөмж', emoji: '\uD83D\uDD27' },
    { key: 'labor', label: 'Хөдөлмөрийн хөлс', emoji: '\uD83D\uDC77' },
    { key: 'other_ex', label: 'Бусад зардал', emoji: '\uD83D\uDCB8' },
  ],
};

function formatPrice(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getCatInfo(key: string) {
  const all = [...categories.income, ...categories.expense];
  return all.find(c => c.key === key) || { label: key, emoji: '\uD83D\uDCB0' };
}

export default function FinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, profit: 0 });
  const [showModal, setShowModal] = useState(false);
  const [recordType, setRecordType] = useState<'income' | 'expense'>('income');
  const [selectedCat, setSelectedCat] = useState('sale');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const userId = 1;

  const loadData = async () => {
    try {
      const [recordsRes, summaryRes] = await Promise.allSettled([
        financeApi.getByUser(userId),
        financeApi.getSummary(userId),
      ]);
      if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleAdd = async () => {
    const num = parseInt(amount);
    if (!num || num <= 0) { Alert.alert('Алдаа', 'Дүн оруулна уу'); return; }
    try {
      await financeApi.add({
        user_id: userId,
        type: recordType,
        category: selectedCat,
        amount: num,
        note: note.trim(),
      });
      setShowModal(false);
      setAmount(''); setNote('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Бүртгэхэд алдаа гарлаа');
    }
  };

  const switchType = (type: 'income' | 'expense') => {
    setRecordType(type);
    setSelectedCat(type === 'income' ? 'sale' : 'feed');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{'\uD83D\uDCB0'} Санхүү</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.summaryLabel}>Орлого</Text>
            <Text style={[styles.summaryAmount, { color: AppColors.success }]}>{'\u20AE'}{formatPrice(summary.total_income)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.summaryLabel}>Зардал</Text>
            <Text style={[styles.summaryAmount, { color: AppColors.danger }]}>{'\u20AE'}{formatPrice(summary.total_expense)}</Text>
          </View>
        </View>

        <View style={[styles.profitCard, { backgroundColor: summary.profit >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={styles.profitLabel}>Цэвэр ашиг</Text>
          <Text style={[styles.profitAmount, { color: summary.profit >= 0 ? AppColors.success : AppColors.danger }]}>
            {summary.profit >= 0 ? '+' : ''}{'\u20AE'}{formatPrice(summary.profit)}
          </Text>
        </View>

        {/* Add buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.success }]}
            onPress={() => { switchType('income'); setShowModal(true); }}
          >
            <Text style={styles.actionBtnText}>+ Орлого нэмэх</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: AppColors.danger }]}
            onPress={() => { switchType('expense'); setShowModal(true); }}
          >
            <Text style={styles.actionBtnText}>+ Зардал нэмэх</Text>
          </TouchableOpacity>
        </View>

        {/* Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Түүх</Text>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>Бүртгэл байхгүй байна</Text>
          ) : (
            records.map((rec: any) => {
              const cat = getCatInfo(rec.category);
              const isIncome = rec.type === 'income';
              return (
                <View key={rec.id} style={styles.recordItem}>
                  <Text style={styles.recordEmoji}>{cat.emoji}</Text>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordCat}>{cat.label}</Text>
                    {rec.note ? <Text style={styles.recordNote}>{rec.note}</Text> : null}
                    <Text style={styles.recordDate}>{rec.record_date?.split(' ')[0]}</Text>
                  </View>
                  <Text style={[styles.recordAmount, { color: isIncome ? AppColors.success : AppColors.danger }]}>
                    {isIncome ? '+' : '-'}{'\u20AE'}{formatPrice(rec.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add record Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {recordType === 'income' ? '\uD83D\uDCB5 Орлого нэмэх' : '\uD83D\uDCB8 Зардал нэмэх'}
            </Text>

            {/* Type toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, recordType === 'income' && styles.toggleIncome]}
                onPress={() => switchType('income')}
              >
                <Text style={[styles.toggleText, recordType === 'income' && styles.toggleTextActive]}>Орлого</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, recordType === 'expense' && styles.toggleExpense]}
                onPress={() => switchType('expense')}
              >
                <Text style={[styles.toggleText, recordType === 'expense' && styles.toggleTextActive]}>Зардал</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ангилал</Text>
            <View style={styles.typeSelector}>
              {categories[recordType].map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.typeBtn, selectedCat === cat.key && styles.typeBtnActive]}
                  onPress={() => setSelectedCat(cat.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedCat === cat.key && styles.typeBtnLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Дүн (₮)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="500000"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Тэмдэглэл</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={note}
              onChangeText={setNote}
              placeholder="Нэмэлт тайлбар..."
              placeholderTextColor={AppColors.gray}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: recordType === 'income' ? AppColors.success : AppColors.danger }]}
                onPress={handleAdd}
              >
                <Text style={styles.saveBtnText}>Бүртгэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: AppColors.black },
  // Summary
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  summaryAmount: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  profitCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 16, alignItems: 'center' },
  profitLabel: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  profitAmount: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  // Actions
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
  // Records
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginBottom: 12 },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  recordItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  recordEmoji: { fontSize: 28, marginRight: 12 },
  recordInfo: { flex: 1 },
  recordCat: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  recordNote: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  recordDate: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  recordAmount: { fontSize: 15, fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AppColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  toggleIncome: { borderColor: AppColors.success, backgroundColor: '#E8F5E9' },
  toggleExpense: { borderColor: AppColors.danger, backgroundColor: '#FFEBEE' },
  toggleText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  toggleTextActive: { color: AppColors.black },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6, marginTop: 12 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  typeBtnActive: { borderColor: AppColors.primary, backgroundColor: '#E8F5E9' },
  typeBtnEmoji: { fontSize: 18 },
  typeBtnLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 2 },
  typeBtnLabelActive: { color: AppColors.primary, fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 15, color: AppColors.black, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.white },
});
