import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { reminderApi, registryApi, financeApi } from '@/services/api';
import { AdBanner } from '@/components/ad-banner';

const tabs = ['Сануулга', 'Бүртгэл', 'Заавар', 'Санхүү'];

const reminderTypes = [
  { key: 'loan', label: 'Зээлийн төлбөр', emoji: '\uD83C\uDFE6' },
  { key: 'vaccine', label: 'Вакцин', emoji: '\uD83D\uDC89' },
  { key: 'feed', label: 'Тэжээл', emoji: '\uD83C\uDF3E' },
  { key: 'seasonal', label: 'Улирлын ажил', emoji: '\uD83D\uDCC5' },
  { key: 'other', label: 'Бусад', emoji: '\uD83D\uDD14' },
];

const registryTypes = [
  { key: 'chips', label: 'Мал чип', emoji: '\uD83D\uDCF1', count: 0 },
  { key: 'wells', label: 'Худаг', emoji: '\uD83D\uDCA7', count: 0 },
  { key: 'land', label: 'Газар / Өвөлжөө', emoji: '\uD83C\uDFD4\uFE0F', count: 0 },
];

const guideCategories = [
  { key: 'shelter', label: 'Малын байр барих', emoji: '\uD83C\uDFE0' },
  { key: 'feed', label: 'Тэжээл тариалах', emoji: '\uD83C\uDF3E' },
  { key: 'water', label: 'Худаг, ус', emoji: '\uD83D\uDCA7' },
  { key: 'tech', label: 'Технологи', emoji: '\uD83D\uDCF1' },
  { key: 'legal', label: 'Бүртгэл, гэрчилгээ', emoji: '\uD83D\uDCDC' },
];

function fmt(n: number) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

export default function ManageScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const userId = 1;

  // Сануулга
  const [reminders, setReminders] = useState<any[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [rType, setRType] = useState('loan');
  const [rTitle, setRTitle] = useState('');
  const [rDate, setRDate] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [rRepeat, setRRepeat] = useState('monthly');

  // Бүртгэл
  const [regSummary, setRegSummary] = useState<any>({});
  const [guides, setGuides] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);

  // Санхүү
  const [finSummary, setFinSummary] = useState<any>({ total_income: 0, total_expense: 0, profit: 0 });
  const [records, setRecords] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const [rem, vac] = await Promise.allSettled([
          reminderApi.getByUser(userId),
          reminderApi.getVaccineSchedule(),
        ]);
        if (rem.status === 'fulfilled') setReminders(rem.value || []);
        if (vac.status === 'fulfilled') setVaccines(vac.value || []);
      } else if (activeTab === 1) {
        const sum = await registryApi.getSummary(userId);
        setRegSummary(sum);
      } else if (activeTab === 2) {
        const g = await registryApi.getGuides();
        setGuides(g || []);
      } else {
        const [sumRes, recRes] = await Promise.allSettled([
          financeApi.getSummary(),
          financeApi.getAll(),
        ]);
        if (sumRes.status === 'fulfilled') setFinSummary(sumRes.value);
        if (recRes.status === 'fulfilled') setRecords((recRes.value || []).slice(0, 10));
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const handleAddReminder = async () => {
    if (!rTitle.trim() || !rDate.trim()) { Alert.alert('Алдаа', 'Нэр, огноо оруулна уу'); return; }
    try {
      await reminderApi.create({ user_id: userId, type: rType, title: rTitle, due_date: rDate, repeat_type: rRepeat, amount: parseInt(rAmount) || 0 });
      setShowAddReminder(false); setRTitle(''); setRDate(''); setRAmount('');
      loadData();
    } catch { Alert.alert('Алдаа', 'Нэмэхэд алдаа гарлаа'); }
  };

  const handleComplete = async (id: number) => {
    await reminderApi.complete(id);
    loadData();
  };

  const loadGuideDetail = async (id: number) => {
    const g = await registryApi.getGuide(id);
    setSelectedGuide(g);
  };

  // ===== САНУУЛГА =====
  const renderReminders = () => (
    <>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddReminder(true)}>
        <Text style={styles.addBtnText}>+ Сануулга нэмэх</Text>
      </TouchableOpacity>

      {reminders.length > 0 ? reminders.map((r: any) => {
        const typeInfo = reminderTypes.find(t => t.key === r.type) || { emoji: '\uD83D\uDD14', label: r.type };
        const isOverdue = new Date(r.due_date) < new Date();
        return (
          <View key={r.id} style={[styles.reminderCard, isOverdue && styles.overdueCard]}>
            <Text style={styles.reminderEmoji}>{typeInfo.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{r.title}</Text>
              <Text style={[styles.reminderDate, isOverdue && { color: AppColors.danger }]}>
                {isOverdue ? '\u26A0\uFE0F ' : ''}{r.due_date}
              </Text>
              {r.amount > 0 && <Text style={styles.reminderAmount}>{'\u20AE'}{fmt(r.amount)}</Text>}
            </View>
            <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(r.id)}>
              <Text style={styles.completeBtnText}>{'\u2713'}</Text>
            </TouchableOpacity>
          </View>
        );
      }) : <Text style={styles.emptyText}>Сануулга байхгүй</Text>}

      {/* Вакцины хуваарь */}
      <Text style={styles.sectionTitle}>{'\uD83D\uDC89'} Вакцины хуваарь</Text>
      {vaccines.slice(0, 8).map((v: any, i: number) => (
        <View key={i} style={styles.vaccineItem}>
          <View style={[styles.mandatoryBadge, { backgroundColor: v.is_mandatory ? '#FFEBEE' : '#E3F2FD' }]}>
            <Text style={{ fontSize: 10, color: v.is_mandatory ? AppColors.danger : '#1565C0', fontWeight: '700' }}>
              {v.is_mandatory ? 'Заавал' : 'Зөвлөмж'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaccineName}>{v.vaccine_name}</Text>
            <Text style={styles.vaccineAnimal}>{v.animal_type} · {v.disease}</Text>
          </View>
          <Text style={styles.vaccineMonth}>{v.recommended_month}-р сар</Text>
        </View>
      ))}
    </>
  );

  // ===== БҮРТГЭЛ =====
  const renderRegistry = () => (
    <>
      <View style={styles.regGrid}>
        {registryTypes.map(rt => (
          <View key={rt.key} style={styles.regCard}>
            <Text style={styles.regEmoji}>{rt.emoji}</Text>
            <Text style={styles.regCount}>{regSummary[rt.key] || 0}</Text>
            <Text style={styles.regLabel}>{rt.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Бүртгэл нэмэх</Text>
      <TouchableOpacity style={styles.regBtn}>
        <Text style={styles.regBtnEmoji}>{'\uD83D\uDCF1'}</Text>
        <View style={{ flex: 1 }}><Text style={styles.regBtnTitle}>Мал чип бүртгэх</Text><Text style={styles.regBtnDesc}>RFID/GPS чип дугаар оруулах</Text></View>
        <Text style={styles.regArrow}>{'\u203A'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.regBtn}>
        <Text style={styles.regBtnEmoji}>{'\uD83D\uDCA7'}</Text>
        <View style={{ flex: 1 }}><Text style={styles.regBtnTitle}>Худаг бүртгэх</Text><Text style={styles.regBtnDesc}>Байршил, гүн, чанар</Text></View>
        <Text style={styles.regArrow}>{'\u203A'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.regBtn}>
        <Text style={styles.regBtnEmoji}>{'\uD83C\uDFD4\uFE0F'}</Text>
        <View style={{ flex: 1 }}><Text style={styles.regBtnTitle}>Газар / Өвөлжөө бүртгэх</Text><Text style={styles.regBtnDesc}>Гэрчилгээ, байршил, талбай</Text></View>
        <Text style={styles.regArrow}>{'\u203A'}</Text>
      </TouchableOpacity>
    </>
  );

  // ===== ЗААВАР =====
  const renderGuides = () => (
    <>
      {selectedGuide ? (
        <View style={styles.guideDetail}>
          <TouchableOpacity onPress={() => setSelectedGuide(null)}>
            <Text style={styles.backText}>{'\u2190'} Буцах</Text>
          </TouchableOpacity>
          <Text style={styles.guideDetailTitle}>{selectedGuide.emoji} {selectedGuide.title}</Text>
          <Text style={styles.guideDetailSummary}>{selectedGuide.summary}</Text>

          {selectedGuide.estimated_cost && (
            <View style={styles.guideInfoRow}>
              <View style={styles.guideInfoItem}><Text style={styles.guideInfoLabel}>Зардал</Text><Text style={styles.guideInfoValue}>{selectedGuide.estimated_cost}</Text></View>
              <View style={styles.guideInfoItem}><Text style={styles.guideInfoLabel}>Хугацаа</Text><Text style={styles.guideInfoValue}>{selectedGuide.duration}</Text></View>
              {selectedGuide.season && <View style={styles.guideInfoItem}><Text style={styles.guideInfoLabel}>Улирал</Text><Text style={styles.guideInfoValue}>{selectedGuide.season}</Text></View>}
            </View>
          )}

          {selectedGuide.steps && (
            <View style={styles.stepsBox}>
              <Text style={styles.stepsTitle}>Алхамууд:</Text>
              <Text style={styles.stepsContent}>{selectedGuide.steps}</Text>
            </View>
          )}

          {selectedGuide.materials && (
            <View style={styles.materialsBox}>
              <Text style={styles.stepsTitle}>Материал:</Text>
              <Text style={styles.stepsContent}>{selectedGuide.materials}</Text>
            </View>
          )}

          <Text style={styles.guideContent}>{selectedGuide.content}</Text>
        </View>
      ) : (
        <>
          {guideCategories.map(cat => {
            const catGuides = guides.filter((g: any) => g.category === cat.key);
            if (catGuides.length === 0) return null;
            return (
              <View key={cat.key}>
                <Text style={styles.sectionTitle}>{cat.emoji} {cat.label}</Text>
                {catGuides.map((g: any) => (
                  <TouchableOpacity key={g.id} style={styles.guideCard} onPress={() => loadGuideDetail(g.id)}>
                    <Text style={styles.guideEmoji}>{g.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guideTitle}>{g.title}</Text>
                      <Text style={styles.guideMeta}>{g.estimated_cost} · {g.duration}</Text>
                    </View>
                    <Text style={styles.regArrow}>{'\u203A'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </>
      )}
    </>
  );

  // ===== САНХҮҮ =====
  const renderFinance = () => (
    <>
      <View style={styles.finRow}>
        <View style={[styles.finCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.finLabel}>Орлого</Text>
          <Text style={[styles.finAmount, { color: AppColors.success }]}>{'\u20AE'}{fmt(finSummary.total_income)}</Text>
        </View>
        <View style={[styles.finCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.finLabel}>Зардал</Text>
          <Text style={[styles.finAmount, { color: AppColors.danger }]}>{'\u20AE'}{fmt(finSummary.total_expense)}</Text>
        </View>
      </View>
      <View style={[styles.profitBox, { backgroundColor: finSummary.profit >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
        <Text style={styles.finLabel}>Цэвэр ашиг</Text>
        <Text style={[styles.profitAmount, { color: finSummary.profit >= 0 ? AppColors.success : AppColors.danger }]}>
          {finSummary.profit >= 0 ? '+' : ''}{'\u20AE'}{fmt(finSummary.profit)}
        </Text>
      </View>
      <Text style={styles.sectionTitle}>Сүүлийн бүртгэл</Text>
      {records.map((r: any) => (
        <View key={r.id} style={styles.finItem}>
          <Text style={[styles.finItemAmount, { color: r.type === 'income' ? AppColors.success : AppColors.danger }]}>
            {r.type === 'income' ? '+' : '-'}{'\u20AE'}{fmt(r.amount)}
          </Text>
          <Text style={styles.finItemNote}>{r.note || r.category}</Text>
          <Text style={styles.finItemDate}>{r.record_date?.split(' ')[0]}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>{'\u2699\uFE0F'} Удирдлага</Text></View>

      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => { setActiveTab(i); setSelectedGuide(null); }}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor={AppColors.primary} />} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} /> : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {activeTab === 0 && renderReminders()}
            {activeTab === 1 && renderRegistry()}
            {activeTab === 2 && renderGuides()}
            {activeTab === 3 && renderFinance()}
          </View>
        )}
        <AdBanner placement="finance" />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Сануулга нэмэх Modal */}
      <Modal visible={showAddReminder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Сануулга нэмэх</Text>
            <Text style={styles.label}>Төрөл</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {reminderTypes.map(rt => (
                  <TouchableOpacity key={rt.key} style={[styles.typeChip, rType === rt.key && styles.typeChipActive]} onPress={() => setRType(rt.key)}>
                    <Text>{rt.emoji} {rt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.label}>Нэр</Text>
            <TextInput style={styles.input} value={rTitle} onChangeText={setRTitle} placeholder="Жнь: Хаан банк зээлийн төлбөр" placeholderTextColor={AppColors.gray} />
            <Text style={styles.label}>Огноо (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={rDate} onChangeText={setRDate} placeholder="2026-05-01" placeholderTextColor={AppColors.gray} />
            <Text style={styles.label}>Дүн (заавал биш)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={rAmount} onChangeText={setRAmount} placeholder="500000" placeholderTextColor={AppColors.gray} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddReminder(false)}><Text style={styles.cancelText}>Болих</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddReminder}><Text style={styles.saveText}>Хадгалах</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#EEE', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  tabText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: AppColors.primary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginTop: 20, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: AppColors.gray, marginTop: 20, fontSize: 14 },
  // Reminder
  addBtn: { backgroundColor: AppColors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginTop: 8, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  overdueCard: { borderWidth: 1.5, borderColor: AppColors.danger },
  reminderEmoji: { fontSize: 24, marginRight: 10 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  reminderDate: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  reminderAmount: { fontSize: 13, fontWeight: '700', color: AppColors.primary, marginTop: 2 },
  completeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  completeBtnText: { fontSize: 18, color: AppColors.success, fontWeight: '800' },
  // Vaccine
  vaccineItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 6, gap: 8 },
  mandatoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vaccineName: { fontSize: 13, fontWeight: '600', color: AppColors.black },
  vaccineAnimal: { fontSize: 11, color: AppColors.grayDark },
  vaccineMonth: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  // Registry
  regGrid: { flexDirection: 'row', gap: 10, marginTop: 8 },
  regCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  regEmoji: { fontSize: 28 },
  regCount: { fontSize: 22, fontWeight: '800', color: AppColors.black, marginTop: 4 },
  regLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 2, textAlign: 'center' },
  regBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginTop: 8, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  regBtnEmoji: { fontSize: 24, marginRight: 12 },
  regBtnTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  regBtnDesc: { fontSize: 11, color: AppColors.grayDark },
  regArrow: { fontSize: 22, color: AppColors.gray },
  // Guides
  guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6, elevation: 1 },
  guideEmoji: { fontSize: 24, marginRight: 10 },
  guideTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  guideMeta: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  guideDetail: {},
  backText: { fontSize: 14, fontWeight: '600', color: AppColors.primary, marginBottom: 12 },
  guideDetailTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black },
  guideDetailSummary: { fontSize: 14, color: AppColors.grayDark, marginTop: 6 },
  guideInfoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  guideInfoItem: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10 },
  guideInfoLabel: { fontSize: 10, color: AppColors.gray, fontWeight: '600' },
  guideInfoValue: { fontSize: 13, fontWeight: '700', color: AppColors.black, marginTop: 2 },
  stepsBox: { backgroundColor: '#F0FFF4', borderRadius: 12, padding: 14, marginTop: 12, borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  materialsBox: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#FF8F00' },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black, marginBottom: 6 },
  stepsContent: { fontSize: 13, color: AppColors.grayDark, lineHeight: 22 },
  guideContent: { fontSize: 13, color: AppColors.grayDark, lineHeight: 20, marginTop: 12 },
  // Finance
  finRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  finCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  finLabel: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  finAmount: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  profitBox: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  profitAmount: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  finItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 6, gap: 10 },
  finItemAmount: { fontSize: 14, fontWeight: '700', width: 100 },
  finItemNote: { flex: 1, fontSize: 12, color: AppColors.grayDark },
  finItemDate: { fontSize: 10, color: AppColors.gray },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 15, color: AppColors.black, backgroundColor: '#FAFAFA' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, backgroundColor: '#FFF' },
  typeChipActive: { borderColor: AppColors.primary, backgroundColor: '#E8F5E9' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: AppColors.primary, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' } });
