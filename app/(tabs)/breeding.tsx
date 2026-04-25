import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { breedingApi, animalsApi } from '@/services/api';

const tabs = ['Хээлтүүлэг', 'Төллөлт', 'Календарь'];

const COLORS = {
  primary: '#2d5016',
  primaryLight: '#4a7c28',
  bg: '#f5f7f0' };

const breedingStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  bred:      { label: 'Хээлтүүлсэн', bg: '#FFF8E1', color: '#F9A825' },
  confirmed: { label: 'Баталгаажсан', bg: '#E3F2FD', color: '#1565C0' },
  due:       { label: 'Хүлээгдэж буй', bg: '#FFF3E0', color: '#EF6C00' },
  delivered: { label: 'Төрсөн', bg: '#E8F5E9', color: '#2E7D32' },
  failed:    { label: 'Амжилтгүй', bg: '#FFEBEE', color: '#C62828' } };

const difficultyMap: Record<string, { label: string; bg: string; color: string }> = {
  easy:      { label: 'Хөнгөн', bg: '#E8F5E9', color: '#2E7D32' },
  normal:    { label: 'Хэвийн', bg: '#E3F2FD', color: '#1565C0' },
  difficult: { label: 'Хүнд', bg: '#FFF3E0', color: '#EF6C00' },
  emergency: { label: 'Яаралтай', bg: '#FFEBEE', color: '#C62828' } };

const methodLabels: Record<string, string> = {
  natural: 'Байгалийн',
  artificial: 'Зохиомлоор' };

function StatusBadge({ map, value }: { map: Record<string, { label: string; bg: string; color: string }>; value: string }) {
  const info = map[value] || { label: value, bg: '#F5F5F5', color: '#616161' };
  return (
    <View style={[s.badge, { backgroundColor: info.bg }]}>
      <Text style={[s.badgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

// Simple picker component
function SimplePicker({ label, items, selectedValue, onValueChange, placeholder }: {
  label: string; items: { label: string; value: any }[]; selectedValue: any;
  onValueChange: (v: any) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = items.find(i => i.value === selectedValue);
  const filtered = search ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())) : items;
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.pickerBtn} onPress={() => setOpen(true)}>
        <Text style={selected ? s.pickerBtnText : s.pickerBtnPlaceholder}>
          {selected ? selected.label : (placeholder || 'Сонгох...')}
        </Text>
        <Text style={{ color: AppColors.gray }}>{'\▼'}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent>
        <View style={s.pickerOverlay}>
          <View style={s.pickerModal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.pickerModalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setSearch(''); }}>
                <Text style={{ fontSize: 16, color: AppColors.danger, fontWeight: '700' }}>{'\✕'}</Text>
              </TouchableOpacity>
            </View>
            {items.length > 6 && (
              <TextInput
                style={s.input}
                placeholder={'Хайх...'}
                placeholderTextColor={AppColors.gray}
                value={search}
                onChangeText={setSearch}
              />
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, item.value === selectedValue && s.pickerItemActive]}
                  onPress={() => { onValueChange(item.value); setOpen(false); setSearch(''); }}
                >
                  <Text style={[s.pickerItemText, item.value === selectedValue && { color: COLORS.primary, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.emptyText}>{'Олдсонгүй'}</Text>}
            />
            {selectedValue != null && (
              <TouchableOpacity style={{ marginTop: 8 }} onPress={() => { onValueChange(null); setOpen(false); setSearch(''); }}>
                <Text style={{ textAlign: 'center', color: AppColors.danger, fontWeight: '600' }}>{'Арилгах'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function BreedingScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animals for pickers
  const [animals, setAnimals] = useState<any[]>([]);
  const femaleAnimals = animals.filter((a: any) => a.gender === 'female' || a.gender === 'эм');
  const maleAnimals = animals.filter((a: any) => a.gender === 'male' || a.gender === 'эр');

  // Breeding
  const [breedingRecords, setBreedingRecords] = useState<any[]>([]);
  const [breedingStats, setBreedingStats] = useState<any>({});
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [editingBreeding, setEditingBreeding] = useState<any>(null);
  const [bFemaleId, setBFemaleId] = useState<number | null>(null);
  const [bMaleId, setBMaleId] = useState<number | null>(null);
  const [bDate, setBDate] = useState('');
  const [bMethod, setBMethod] = useState('natural');
  const [bNotes, setBNotes] = useState('');

  // Birth
  const [birthRecords, setBirthRecords] = useState<any[]>([]);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [editingBirth, setEditingBirth] = useState<any>(null);
  const [birthMotherId, setBirthMotherId] = useState<number | null>(null);
  const [birthFatherId, setBirthFatherId] = useState<number | null>(null);
  const [birthBreedingId, setBirthBreedingId] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [birthOffspring, setBirthOffspring] = useState('1');
  const [birthAlive, setBirthAlive] = useState('1');
  const [birthDifficulty, setBirthDifficulty] = useState('normal');
  const [birthNotes, setBirthNotes] = useState('');

  // Calendar
  const [calendarData, setCalendarData] = useState<any[]>([]);

  const animalName = (id: number) => {
    const a = animals.find((x: any) => x.id === id);
    return a ? `${a.name || a.animal_type || 'Мал'}${a.ear_tag ? ' (' + a.ear_tag + ')' : ''}` : `#${id}`;
  };

  const femalePickerItems = femaleAnimals.map((a: any) => ({
    label: `${a.name || a.animal_type || 'Эм мал'}${a.ear_tag ? ' (' + a.ear_tag + ')' : ''}`,
    value: a.id }));

  const malePickerItems = maleAnimals.map((a: any) => ({
    label: `${a.name || a.animal_type || 'Эр мал'}${a.ear_tag ? ' (' + a.ear_tag + ')' : ''}`,
    value: a.id }));

  const breedingPickerItems = breedingRecords.map((b: any) => ({
    label: `${animalName(b.female_id)} - ${b.breeding_date}`,
    value: b.id }));

  const loadAnimals = async () => {
    try {
      const res = await animalsApi.getAll();
      setAnimals(Array.isArray(res) ? res : (res?.data || res?.animals || []));
    } catch {}
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      if (activeTab === 0) {
        const [recs, stats] = await Promise.allSettled([
          breedingApi.getAll(),
          breedingApi.getStats(),
        ]);
        if (recs.status === 'fulfilled') {
          const data = recs.value;
          setBreedingRecords(Array.isArray(data) ? data : (data?.data || data?.records || []));
        }
        if (stats.status === 'fulfilled') setBreedingStats(stats.value || {});
      } else if (activeTab === 1) {
        const res = await breedingApi.getBirths();
        setBirthRecords(Array.isArray(res) ? res : (res?.data || res?.births || []));
      } else {
        const res = await breedingApi.getCalendar();
        setCalendarData(Array.isArray(res) ? res : (res?.data || res?.calendar || []));
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAnimals(); }, []);
  useEffect(() => { loadData(); }, [activeTab]);

  const onRefresh = useCallback(() => { loadData(true); }, [activeTab]);

  // ========== Breeding CRUD ==========
  const resetBreedingForm = () => {
    setBFemaleId(null); setBMaleId(null); setBDate(''); setBMethod('natural'); setBNotes('');
    setEditingBreeding(null);
  };

  const openAddBreeding = () => { resetBreedingForm(); setShowBreedingModal(true); };

  const openEditBreeding = (rec: any) => {
    setEditingBreeding(rec);
    setBFemaleId(rec.female_id); setBMaleId(rec.male_id || null);
    setBDate(rec.breeding_date || ''); setBMethod(rec.breeding_method || 'natural');
    setBNotes(rec.notes || '');
    setShowBreedingModal(true);
  };

  const handleSaveBreeding = async () => {
    if (!bFemaleId || !bDate.trim()) {
      Alert.alert('Алдаа', 'Эм мал болон огноо оруулна уу');
      return;
    }
    const payload: any = {
      female_id: bFemaleId,
      breeding_date: bDate,
      breeding_method: bMethod,
      notes: bNotes };
    if (bMaleId) payload.male_id = bMaleId;
    try {
      if (editingBreeding) {
        await breedingApi.update(editingBreeding.id, payload);
      } else {
        await breedingApi.create(payload);
      }
      setShowBreedingModal(false);
      resetBreedingForm();
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
    }
  };

  const handleDeleteBreeding = (id: number) => {
    Alert.alert('Устгах', 'Энэ бүртгэлийг устгах уу?', [
      { text: 'Үгүй', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await breedingApi.delete(id); loadData(); }
        catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ========== Birth CRUD ==========
  const resetBirthForm = () => {
    setBirthMotherId(null); setBirthFatherId(null); setBirthBreedingId(null);
    setBirthDate(''); setBirthOffspring('1'); setBirthAlive('1');
    setBirthDifficulty('normal'); setBirthNotes('');
    setEditingBirth(null);
  };

  const openAddBirth = () => { resetBirthForm(); setShowBirthModal(true); };

  const openEditBirth = (rec: any) => {
    setEditingBirth(rec);
    setBirthMotherId(rec.mother_id); setBirthFatherId(rec.father_id || null);
    setBirthBreedingId(rec.breeding_id || null);
    setBirthDate(rec.birth_date || ''); setBirthOffspring(String(rec.offspring_count || 1));
    setBirthAlive(String(rec.alive_count || 1)); setBirthDifficulty(rec.difficulty || 'normal');
    setBirthNotes(rec.notes || '');
    setShowBirthModal(true);
  };

  const handleSaveBirth = async () => {
    if (!birthMotherId || !birthDate.trim()) {
      Alert.alert('Алдаа', 'Эх мал болон огноо оруулна уу');
      return;
    }
    const payload: any = {
      mother_id: birthMotherId,
      birth_date: birthDate,
      offspring_count: parseInt(birthOffspring) || 1,
      alive_count: parseInt(birthAlive) || 1,
      difficulty: birthDifficulty,
      notes: birthNotes };
    if (birthFatherId) payload.father_id = birthFatherId;
    if (birthBreedingId) payload.breeding_id = birthBreedingId;
    try {
      if (editingBirth) {
        await breedingApi.updateBirth(editingBirth.id, payload);
      } else {
        await breedingApi.createBirth(payload);
      }
      setShowBirthModal(false);
      resetBirthForm();
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
    }
  };

  const handleDeleteBirth = (id: number) => {
    Alert.alert('Устгах', 'Энэ төллөлтийн бүртгэлийг устгах уу?', [
      { text: 'Үгүй', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await breedingApi.deleteBirth(id); loadData(); }
        catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ========== RENDER: Breeding Tab ==========
  const renderBreeding = () => {
    const total = breedingStats.total || breedingRecords.length;
    const successRate = breedingStats.success_rate ?? breedingStats.successRate ?? 0;
    const pending = breedingStats.pending ?? breedingStats.due ?? breedingRecords.filter((r: any) => r.status === 'bred' || r.status === 'confirmed' || r.status === 'due').length;

    return (
      <>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{total}</Text>
            <Text style={s.statLabel}>{'Нийт хээлтүүлэг'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: '#2E7D32' }]}>{successRate}%</Text>
            <Text style={s.statLabel}>{'Амжилтын хувь'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: '#EF6C00' }]}>{pending}</Text>
            <Text style={s.statLabel}>{'Хүлээгдэж буй'}</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={s.addBtn} onPress={openAddBreeding}>
          <Text style={s.addBtnText}>+ Хээлтүүлэг</Text>
        </TouchableOpacity>

        {/* List */}
        {breedingRecords.length > 0 ? breedingRecords.map((rec: any) => (
          <View key={rec.id} style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{'\♀\️'} {animalName(rec.female_id)}</Text>
                {rec.male_id && <Text style={s.cardSub}>{'\♂\️'} {animalName(rec.male_id)}</Text>}
              </View>
              <StatusBadge map={breedingStatusMap} value={rec.status} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardInfoText}>{'\�\�'} {rec.breeding_date}</Text>
              {rec.expected_due_date && <Text style={s.cardInfoText}>{'\�\�'} Төллөх: {rec.expected_due_date}</Text>}
              <Text style={s.cardInfoText}>{rec.breeding_method === 'artificial' ? '\�\� Зохиомлоор' : '\�\� Байгалийн'}</Text>
            </View>
            {rec.notes ? <Text style={s.cardNotes}>{rec.notes}</Text> : null}
            <View style={s.cardActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => openEditBreeding(rec)}>
                <Text style={s.editBtnText}>{'\✏\️'} Засах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteBreeding(rec.id)}>
                <Text style={s.deleteBtnText}>{'\�\�\️'} Устгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : <Text style={s.emptyText}>{'Хээлтүүлгийн бүртгэл байхгүй'}</Text>}
      </>
    );
  };

  // ========== RENDER: Birth Tab ==========
  const renderBirth = () => {
    const totalBirths = birthRecords.length;
    const avgOffspring = totalBirths > 0
      ? (birthRecords.reduce((sum: number, r: any) => sum + (r.offspring_count || 0), 0) / totalBirths).toFixed(1)
      : '0';
    const totalAlive = birthRecords.reduce((sum: number, r: any) => sum + (r.alive_count || 0), 0);

    return (
      <>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{totalBirths}</Text>
            <Text style={s.statLabel}>{'Нийт төллөлт'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: '#1565C0' }]}>{avgOffspring}</Text>
            <Text style={s.statLabel}>{'Дундаж төл'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: '#2E7D32' }]}>{totalAlive}</Text>
            <Text style={s.statLabel}>{'Амьд төл'}</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={s.addBtn} onPress={openAddBirth}>
          <Text style={s.addBtnText}>+ Төллөлт</Text>
        </TouchableOpacity>

        {/* List */}
        {birthRecords.length > 0 ? birthRecords.map((rec: any) => (
          <View key={rec.id} style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{'\�\�'} {animalName(rec.mother_id)}</Text>
                {rec.father_id && <Text style={s.cardSub}>{'\♂\️'} {animalName(rec.father_id)}</Text>}
              </View>
              <StatusBadge map={difficultyMap} value={rec.difficulty || 'normal'} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardInfoText}>{'\�\�'} {rec.birth_date}</Text>
              <Text style={s.cardInfoText}>{'\�\�'} Төл: {rec.offspring_count || 0} | Амьд: {rec.alive_count || 0}</Text>
            </View>
            {rec.notes ? <Text style={s.cardNotes}>{rec.notes}</Text> : null}
            <View style={s.cardActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => openEditBirth(rec)}>
                <Text style={s.editBtnText}>{'\✏\️'} Засах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteBirth(rec.id)}>
                <Text style={s.deleteBtnText}>{'\�\�\️'} Устгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : <Text style={s.emptyText}>{'Төллөлтийн бүртгэл байхгүй'}</Text>}
      </>
    );
  };

  // ========== RENDER: Calendar Tab ==========
  const renderCalendar = () => {
    const today = new Date();
    const sorted = [...calendarData].sort((a: any, b: any) => {
      const da = new Date(a.expected_due_date || a.due_date || a.date);
      const db = new Date(b.expected_due_date || b.due_date || b.date);
      return da.getTime() - db.getTime();
    });

    return (
      <>
        <Text style={s.sectionTitle}>{'\�\�'} Төллөх хуваарь</Text>
        {sorted.length > 0 ? sorted.map((entry: any, idx: number) => {
          const dueDate = new Date(entry.expected_due_date || entry.due_date || entry.date);
          const diffMs = dueDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const dateStr = (entry.expected_due_date || entry.due_date || entry.date || '').split('T')[0];

          let urgencyColor = '#2E7D32'; // green
          let urgencyBg = '#E8F5E9';
          let urgencyLabel = `${daysRemaining} өдөр үлдсэн`;
          if (daysRemaining <= 0) {
            urgencyColor = '#C62828'; urgencyBg = '#FFEBEE';
            urgencyLabel = daysRemaining === 0 ? 'Өнөөдөр!' : `${Math.abs(daysRemaining)} өдөр хоцорсон`;
          } else if (daysRemaining <= 7) {
            urgencyColor = '#C62828'; urgencyBg = '#FFEBEE';
            urgencyLabel = `${daysRemaining} өдөр үлдсэн`;
          } else if (daysRemaining <= 30) {
            urgencyColor = '#EF6C00'; urgencyBg = '#FFF3E0';
            urgencyLabel = `${daysRemaining} өдөр үлдсэн`;
          }

          const femaleName = entry.female_name || entry.animal_name || animalName(entry.female_id || entry.animal_id || 0);

          return (
            <View key={entry.id || idx} style={[s.calendarCard, { borderLeftColor: urgencyColor }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.calendarAnimal}>{'\♀\️'} {femaleName}</Text>
                  <Text style={s.calendarDate}>{'\�\�'} Төллөх огноо: {dateStr}</Text>
                </View>
                <View style={[s.urgencyBadge, { backgroundColor: urgencyBg }]}>
                  <Text style={[s.urgencyText, { color: urgencyColor }]}>{urgencyLabel}</Text>
                </View>
              </View>
            </View>
          );
        }) : <Text style={s.emptyText}>{'Хүлээгдэж буй төллөлт байхгүй'}</Text>}
      </>
    );
  };

  // ========== MAIN RENDER ==========
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\�\�'} Хээлтүүлэг & Төллөлт</Text>
      </View>

      {/* Sub-tab bar */}
      <View style={s.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === i && s.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[s.tabText, activeTab === i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {activeTab === 0 && renderBreeding()}
            {activeTab === 1 && renderBirth()}
            {activeTab === 2 && renderCalendar()}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== Breeding Modal ===== */}
      <Modal visible={showBreedingModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>{editingBreeding ? 'Хээлтүүлэг засах' : 'Хээлтүүлэг нэмэх'}</Text>

              <SimplePicker
                label={'Эм мал *'}
                items={femalePickerItems}
                selectedValue={bFemaleId}
                onValueChange={setBFemaleId}
                placeholder={'Эм малуудаас сонгох'}
              />

              <SimplePicker
                label={'Эр мал'}
                items={malePickerItems}
                selectedValue={bMaleId}
                onValueChange={setBMaleId}
                placeholder={'Эр малуудаас сонгох'}
              />

              <Text style={s.label}>{'Огноо (YYYY-MM-DD) *'}</Text>
              <TextInput style={s.input} value={bDate} onChangeText={setBDate} placeholder="2026-04-01" placeholderTextColor={AppColors.gray} />

              <Text style={s.label}>{'Арга'}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[s.methodChip, bMethod === 'natural' && s.methodChipActive]}
                  onPress={() => setBMethod('natural')}
                >
                  <Text style={bMethod === 'natural' ? s.methodChipTextActive : s.methodChipText}>
                    {'\�\�'} Байгалийн
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.methodChip, bMethod === 'artificial' && s.methodChipActive]}
                  onPress={() => setBMethod('artificial')}
                >
                  <Text style={bMethod === 'artificial' ? s.methodChipTextActive : s.methodChipText}>
                    {'\�\�'} Зохиомлоор
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>{'Тэмдэглэл'}</Text>
              <TextInput
                style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                value={bNotes}
                onChangeText={setBNotes}
                placeholder={'Нэмэлт тэмдэглэл...'}
                placeholderTextColor={AppColors.gray}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowBreedingModal(false); resetBreedingForm(); }}>
                  <Text style={s.cancelText}>{'Болих'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSaveBreeding}>
                  <Text style={s.saveText}>{'Хадгалах'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== Birth Modal ===== */}
      <Modal visible={showBirthModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>{editingBirth ? 'Төллөлт засах' : 'Төллөлт нэмэх'}</Text>

              <SimplePicker
                label={'Эх мал *'}
                items={femalePickerItems}
                selectedValue={birthMotherId}
                onValueChange={setBirthMotherId}
                placeholder={'Эх мал сонгох'}
              />

              <SimplePicker
                label={'Аав мал'}
                items={malePickerItems}
                selectedValue={birthFatherId}
                onValueChange={setBirthFatherId}
                placeholder={'Аав мал сонгох (заавал биш)'}
              />

              <SimplePicker
                label={'Хээлтүүлгийн бүртгэл'}
                items={breedingPickerItems}
                selectedValue={birthBreedingId}
                onValueChange={setBirthBreedingId}
                placeholder={'Холбоос сонгох (заавал биш)'}
              />

              <Text style={s.label}>{'Төллөсөн огноо (YYYY-MM-DD) *'}</Text>
              <TextInput style={s.input} value={birthDate} onChangeText={setBirthDate} placeholder="2026-04-01" placeholderTextColor={AppColors.gray} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{'Төлийн тоо'}</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={birthOffspring} onChangeText={setBirthOffspring} placeholder="1" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{'Амьд тоо'}</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={birthAlive} onChangeText={setBirthAlive} placeholder="1" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={s.label}>{'Төллөлтийн хүндрэл'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(difficultyMap).map(([key, val]) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.diffChip, birthDifficulty === key && { backgroundColor: val.bg, borderColor: val.color }]}
                    onPress={() => setBirthDifficulty(key)}
                  >
                    <Text style={[s.diffChipText, birthDifficulty === key && { color: val.color, fontWeight: '700' }]}>
                      {val.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>{'Тэмдэглэл'}</Text>
              <TextInput
                style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                value={birthNotes}
                onChangeText={setBirthNotes}
                placeholder={'Нэмэлт тэмдэглэл...'}
                placeholderTextColor={AppColors.gray}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowBirthModal(false); resetBirthForm(); }}>
                  <Text style={s.cancelText}>{'Болих'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSaveBirth}>
                  <Text style={s.saveText}>{'Хадгалах'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },

  // Tab bar
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#e0e8d5', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  tabText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 2, textAlign: 'center' },

  // Buttons
  addBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginTop: 10, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  cardSub: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  cardInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  cardInfoText: { fontSize: 12, color: AppColors.grayDark },
  cardNotes: { fontSize: 12, color: AppColors.gray, marginTop: 6, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E3F2FD' },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#1565C0' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFEBEE' },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#C62828' },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Calendar
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginTop: 12, marginBottom: 10 },
  calendarCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  calendarAnimal: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  calendarDate: { fontSize: 12, color: AppColors.grayDark, marginTop: 4 },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  urgencyText: { fontSize: 11, fontWeight: '700' },

  emptyText: { textAlign: 'center', color: AppColors.gray, marginTop: 24, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 15, color: AppColors.black, backgroundColor: '#FAFAFA' },

  // Method chips
  methodChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center', backgroundColor: '#FFF' },
  methodChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.bg },
  methodChipText: { fontSize: 13, color: AppColors.grayDark },
  methodChipTextActive: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  // Difficulty chips
  diffChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, backgroundColor: '#FFF' },
  diffChipText: { fontSize: 12, color: AppColors.grayDark },

  // Modal buttons
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Picker
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
  pickerBtnText: { fontSize: 15, color: AppColors.black },
  pickerBtnPlaceholder: { fontSize: 15, color: AppColors.gray },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  pickerModal: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '70%' },
  pickerModalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.black },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pickerItemActive: { backgroundColor: COLORS.bg },
  pickerItemText: { fontSize: 15, color: AppColors.black } });
