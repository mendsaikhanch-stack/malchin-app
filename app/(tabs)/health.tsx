import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { healthApi, animalsApi } from '@/services/api';
import { AdBanner } from '@/components/ad-banner';

const tabs = ['Эрүүл мэнд', 'Вакцин', 'Хуваарь'];

const animalTypes = [
  { key: 'sheep', label: 'Хонь', emoji: '\�\�' },
  { key: 'goat', label: 'Ямаа', emoji: '\�\�' },
  { key: 'cattle', label: 'Үхэр', emoji: '\�\�' },
  { key: 'horse', label: 'Адуу', emoji: '\�\�' },
  { key: 'camel', label: 'Тэмээ', emoji: '\�\�' },
];

const recordTypes = [
  { key: 'illness', label: 'Өвчин', emoji: '\�\�' },
  { key: 'injury', label: 'Гэмтэл', emoji: '\�\�' },
  { key: 'checkup', label: 'Үзлэг', emoji: '\�\�' },
  { key: 'treatment', label: 'Эмчилгээ', emoji: '\�\�' },
  { key: 'deworming', label: 'Туулга', emoji: '\�\�' },
];

const severityLevels = [
  { key: 'low', label: 'Хөнгөн', color: '#43A047' },
  { key: 'medium', label: 'Дунд', color: '#FF8F00' },
  { key: 'high', label: 'Хүнд', color: '#E53935' },
];

const statusLabels: Record<string, string> = {
  treated: 'Эмчилсэн',
  pending: 'Хүлээгдэж буй',
  monitoring: 'Хянаж буй' };

function fmt(n: number) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function getAnimalEmoji(type: string) {
  return animalTypes.find(a => a.key === type)?.emoji || '\�\�';
}

function getAnimalLabel(type: string) {
  return animalTypes.find(a => a.key === type)?.label || type;
}

export default function HealthScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animals for picker
  const [animals, setAnimals] = useState<any[]>([]);

  // Health records
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>({ total_records: 0, total_cost: 0, pending_checkups: 0 });
  const [filterType, setFilterType] = useState('');
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [editingHealth, setEditingHealth] = useState<any>(null);
  const [hAnimalId, setHAnimalId] = useState('');
  const [hRecordType, setHRecordType] = useState('illness');
  const [hTitle, setHTitle] = useState('');
  const [hDescription, setHDescription] = useState('');
  const [hDiagnosis, setHDiagnosis] = useState('');
  const [hTreatment, setHTreatment] = useState('');
  const [hMedication, setHMedication] = useState('');
  const [hDosage, setHDosage] = useState('');
  const [hVetName, setHVetName] = useState('');
  const [hCost, setHCost] = useState('');
  const [hDate, setHDate] = useState('');
  const [hNextCheckup, setHNextCheckup] = useState('');
  const [hSeverity, setHSeverity] = useState('low');

  // Vaccinations
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<any>(null);
  const [vMode, setVMode] = useState<'individual' | 'batch'>('individual');
  const [vAnimalId, setVAnimalId] = useState('');
  const [vAnimalType, setVAnimalType] = useState('sheep');
  const [vAnimalCount, setVAnimalCount] = useState('');
  const [vName, setVName] = useState('');
  const [vDisease, setVDisease] = useState('');
  const [vDate, setVDate] = useState('');
  const [vNextDue, setVNextDue] = useState('');
  const [vBatchNumber, setVBatchNumber] = useState('');
  const [vAdministeredBy, setVAdministeredBy] = useState('');
  const [vCost, setVCost] = useState('');
  const [vNotes, setVNotes] = useState('');

  // Due/Schedule
  const [dueVaccinations, setDueVaccinations] = useState<any[]>([]);

  // Animal picker
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [animalPickerTarget, setAnimalPickerTarget] = useState<'health' | 'vaccine'>('health');

  const loadAnimals = async () => {
    try {
      const res = await animalsApi.getAll();
      setAnimals(res || []);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const filters: any = {};
        if (filterType) filters.record_type = filterType;
        const [recs, stats] = await Promise.allSettled([
          healthApi.getAll(filters),
          healthApi.getStats(),
        ]);
        if (recs.status === 'fulfilled') setHealthRecords(recs.value || []);
        if (stats.status === 'fulfilled') setHealthStats(stats.value || {});
      } else if (activeTab === 1) {
        const res = await healthApi.getVaccinations();
        setVaccinations(res || []);
      } else {
        const res = await healthApi.getVaccinationsDue();
        setDueVaccinations(res || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadAnimals(); }, []);
  useEffect(() => { loadData(); }, [activeTab, filterType]);

  const getAnimalName = (id: number) => {
    const a = animals.find((an: any) => an.id === id);
    return a ? `${getAnimalEmoji(a.type)} ${a.name}` : `#${id}`;
  };

  // ===== Health CRUD =====
  const resetHealthForm = () => {
    setHAnimalId(''); setHRecordType('illness'); setHTitle(''); setHDescription('');
    setHDiagnosis(''); setHTreatment(''); setHMedication(''); setHDosage('');
    setHVetName(''); setHCost(''); setHDate(''); setHNextCheckup(''); setHSeverity('low');
    setEditingHealth(null);
  };

  const openAddHealth = () => { resetHealthForm(); setShowAddHealth(true); };

  const openEditHealth = (r: any) => {
    setEditingHealth(r);
    setHAnimalId(r.animal_id?.toString() || '');
    setHRecordType(r.record_type || 'illness');
    setHTitle(r.title || '');
    setHDescription(r.description || '');
    setHDiagnosis(r.diagnosis || '');
    setHTreatment(r.treatment || '');
    setHMedication(r.medication || '');
    setHDosage(r.dosage || '');
    setHVetName(r.vet_name || '');
    setHCost(r.cost?.toString() || '');
    setHDate(r.record_date?.split(' ')[0] || '');
    setHNextCheckup(r.next_checkup || '');
    setHSeverity(r.severity || 'low');
    setShowAddHealth(true);
  };

  const handleSaveHealth = async () => {
    if (!hAnimalId || !hTitle.trim() || !hDate.trim()) {
      Alert.alert('Алдаа', 'Мал, нэр, огноо оруулна уу');
      return;
    }
    const data: any = {
      animal_id: parseInt(hAnimalId),
      record_type: hRecordType,
      title: hTitle.trim(),
      record_date: hDate.trim(),
      severity: hSeverity };
    if (hDescription.trim()) data.description = hDescription.trim();
    if (hDiagnosis.trim()) data.diagnosis = hDiagnosis.trim();
    if (hTreatment.trim()) data.treatment = hTreatment.trim();
    if (hMedication.trim()) data.medication = hMedication.trim();
    if (hDosage.trim()) data.dosage = hDosage.trim();
    if (hVetName.trim()) data.vet_name = hVetName.trim();
    if (hCost) data.cost = parseInt(hCost) || 0;
    if (hNextCheckup.trim()) data.next_checkup = hNextCheckup.trim();

    try {
      if (editingHealth) {
        await healthApi.update(editingHealth.id, data);
      } else {
        await healthApi.create(data);
      }
      setShowAddHealth(false);
      resetHealthForm();
      loadData();
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  const handleDeleteHealth = (id: number) => {
    Alert.alert('Устгах', 'Энэ бүртгэлийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await healthApi.delete(id); loadData(); } catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ===== Vaccine CRUD =====
  const resetVaccineForm = () => {
    setVMode('individual'); setVAnimalId(''); setVAnimalType('sheep'); setVAnimalCount('');
    setVName(''); setVDisease(''); setVDate(''); setVNextDue('');
    setVBatchNumber(''); setVAdministeredBy(''); setVCost(''); setVNotes('');
    setEditingVaccine(null);
  };

  const openAddVaccine = () => { resetVaccineForm(); setShowAddVaccine(true); };

  const openEditVaccine = (v: any) => {
    setEditingVaccine(v);
    if (v.animal_id) { setVMode('individual'); setVAnimalId(v.animal_id.toString()); }
    else { setVMode('batch'); setVAnimalType(v.animal_type || 'sheep'); setVAnimalCount(v.animal_count?.toString() || ''); }
    setVName(v.vaccine_name || '');
    setVDisease(v.disease || '');
    setVDate(v.vaccination_date?.split(' ')[0] || '');
    setVNextDue(v.next_due_date || '');
    setVBatchNumber(v.batch_number || '');
    setVAdministeredBy(v.administered_by || '');
    setVCost(v.cost?.toString() || '');
    setVNotes(v.notes || '');
    setShowAddVaccine(true);
  };

  const handleSaveVaccine = async () => {
    if (!vName.trim() || !vDate.trim()) {
      Alert.alert('Алдаа', 'Вакцины нэр, огноо оруулна уу');
      return;
    }
    if (vMode === 'individual' && !vAnimalId) {
      Alert.alert('Алдаа', 'Малаа сонгоно уу');
      return;
    }
    if (vMode === 'batch' && !vAnimalCount) {
      Alert.alert('Алдаа', 'Малын тоо оруулна уу');
      return;
    }
    const data: any = {
      vaccine_name: vName.trim(),
      vaccination_date: vDate.trim() };
    if (vMode === 'individual') {
      data.animal_id = parseInt(vAnimalId);
    } else {
      data.animal_type = vAnimalType;
      data.animal_count = parseInt(vAnimalCount) || 0;
    }
    if (vDisease.trim()) data.disease = vDisease.trim();
    if (vNextDue.trim()) data.next_due_date = vNextDue.trim();
    if (vBatchNumber.trim()) data.batch_number = vBatchNumber.trim();
    if (vAdministeredBy.trim()) data.administered_by = vAdministeredBy.trim();
    if (vCost) data.cost = parseInt(vCost) || 0;
    if (vNotes.trim()) data.notes = vNotes.trim();

    try {
      if (editingVaccine) {
        await healthApi.updateVaccination(editingVaccine.id, data);
      } else {
        await healthApi.createVaccination(data);
      }
      setShowAddVaccine(false);
      resetVaccineForm();
      loadData();
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  const handleDeleteVaccine = (id: number) => {
    Alert.alert('Устгах', 'Энэ вакцины бүртгэлийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await healthApi.deleteVaccination(id); loadData(); } catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ===== Animal Picker =====
  const openAnimalPicker = (target: 'health' | 'vaccine') => {
    setAnimalPickerTarget(target);
    setShowAnimalPicker(true);
  };

  const selectAnimal = (a: any) => {
    if (animalPickerTarget === 'health') setHAnimalId(a.id.toString());
    else setVAnimalId(a.id.toString());
    setShowAnimalPicker(false);
  };

  // ===== TAB 1: HEALTH RECORDS =====
  const renderHealth = () => {
    const sevColor = (s: string) => severityLevels.find(sv => sv.key === s)?.color || AppColors.gray;
    return (
      <>
        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.statEmoji}>{'\�\�'}</Text>
            <Text style={styles.statValue}>{healthStats.total_records || 0}</Text>
            <Text style={styles.statLabel}>Нийт эмчилгээ</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
            <Text style={styles.statEmoji}>{'\₮'}</Text>
            <Text style={styles.statValue}>{fmt(healthStats.total_cost || 0)}</Text>
            <Text style={styles.statLabel}>Мал эмчийн зардал</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.statEmoji}>{'\�\�'}</Text>
            <Text style={styles.statValue}>{healthStats.pending_checkups || 0}</Text>
            <Text style={styles.statLabel}>Шалгуулах мал</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.filterChip, !filterType && styles.filterChipActive]}
              onPress={() => setFilterType('')}
            >
              <Text style={[styles.filterChipText, !filterType && styles.filterChipTextActive]}>Бүгд</Text>
            </TouchableOpacity>
            {recordTypes.map(rt => (
              <TouchableOpacity
                key={rt.key}
                style={[styles.filterChip, filterType === rt.key && styles.filterChipActive]}
                onPress={() => setFilterType(filterType === rt.key ? '' : rt.key)}
              >
                <Text style={[styles.filterChipText, filterType === rt.key && styles.filterChipTextActive]}>
                  {rt.emoji} {rt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={openAddHealth}>
          <Text style={styles.addBtnText}>+ Бүртгэл</Text>
        </TouchableOpacity>

        {/* Records list */}
        {healthRecords.length > 0 ? healthRecords.map((r: any) => {
          const rtInfo = recordTypes.find(rt => rt.key === r.record_type) || { emoji: '\�\�', label: r.record_type };
          const sev = severityLevels.find(sv => sv.key === r.severity);
          return (
            <TouchableOpacity key={r.id} style={styles.recordCard} onPress={() => openEditHealth(r)} onLongPress={() => handleDeleteHealth(r.id)}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordAnimal}>{getAnimalName(r.animal_id)}</Text>
                {sev && (
                  <View style={[styles.sevBadge, { backgroundColor: sev.color + '20' }]}>
                    <Text style={[styles.sevBadgeText, { color: sev.color }]}>{sev.label}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.recordTitle}>{rtInfo.emoji} {r.title}</Text>
              {r.diagnosis ? <Text style={styles.recordDiagnosis}>Онош: {r.diagnosis}</Text> : null}
              <View style={styles.recordFooter}>
                <Text style={styles.recordDate}>{r.record_date?.split(' ')[0]}</Text>
                {r.status && (
                  <View style={[styles.statusBadge, {
                    backgroundColor: r.status === 'treated' ? '#E8F5E9' : r.status === 'pending' ? '#FFF8E1' : '#E3F2FD' }]}>
                    <Text style={[styles.statusText, {
                      color: r.status === 'treated' ? AppColors.success : r.status === 'pending' ? AppColors.warning : AppColors.accent }]}>{statusLabels[r.status] || r.status}</Text>
                  </View>
                )}
                {r.cost > 0 && <Text style={styles.recordCost}>{'\₮'}{fmt(r.cost)}</Text>}
              </View>
            </TouchableOpacity>
          );
        }) : <Text style={styles.emptyText}>Эрүүл мэндийн бүртгэл байхгүй</Text>}
      </>
    );
  };

  // ===== TAB 2: VACCINATIONS =====
  const renderVaccinations = () => (
    <>
      <TouchableOpacity style={styles.addBtn} onPress={openAddVaccine}>
        <Text style={styles.addBtnText}>+ Вакцин</Text>
      </TouchableOpacity>

      {vaccinations.length > 0 ? vaccinations.map((v: any) => {
        const animalDisplay = v.animal_id
          ? getAnimalName(v.animal_id)
          : `${getAnimalEmoji(v.animal_type)} ${getAnimalLabel(v.animal_type)} x${v.animal_count || ''}`;
        return (
          <TouchableOpacity key={v.id} style={styles.vaccineCard} onPress={() => openEditVaccine(v)} onLongPress={() => handleDeleteVaccine(v.id)}>
            <View style={styles.vaccineCardHeader}>
              <Text style={styles.vaccineCardName}>{'\�\�'} {v.vaccine_name}</Text>
              {v.cost > 0 && <Text style={styles.vaccineCardCost}>{'\₮'}{fmt(v.cost)}</Text>}
            </View>
            {v.disease ? <Text style={styles.vaccineCardDisease}>Өвчин: {v.disease}</Text> : null}
            <Text style={styles.vaccineCardAnimal}>{animalDisplay}</Text>
            <View style={styles.vaccineCardFooter}>
              <Text style={styles.vaccineCardDate}>{'\�\�'} {v.vaccination_date?.split(' ')[0]}</Text>
              {v.next_due_date && (
                <Text style={styles.vaccineCardNext}>Дараагийн: {v.next_due_date}</Text>
              )}
            </View>
            {v.administered_by ? <Text style={styles.vaccineCardVet}>{'\�\�\‍\⚕\️'} {v.administered_by}</Text> : null}
          </TouchableOpacity>
        );
      }) : <Text style={styles.emptyText}>Вакцины бүртгэл байхгүй</Text>}
    </>
  );

  // ===== TAB 3: DUE/SCHEDULE =====
  const renderSchedule = () => {
    const today = new Date();
    return (
      <>
        <Text style={styles.sectionTitle}>{'\�\�'} Удахгүй хийгдэх вакцин</Text>
        {dueVaccinations.length > 0 ? dueVaccinations.map((v: any, i: number) => {
          const dueDate = new Date(v.next_due_date);
          const diffMs = dueDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          const isUrgent = daysLeft >= 0 && daysLeft <= 3;
          const isSoon = daysLeft > 3 && daysLeft <= 7;
          const urgencyColor = isOverdue ? AppColors.danger : isUrgent ? AppColors.danger : isSoon ? AppColors.warning : AppColors.success;
          const urgencyBg = isOverdue ? '#FFEBEE' : isUrgent ? '#FFEBEE' : isSoon ? '#FFF8E1' : '#E8F5E9';

          const animalDisplay = v.animal_id
            ? getAnimalName(v.animal_id)
            : v.animal_type
              ? `${getAnimalEmoji(v.animal_type)} ${getAnimalLabel(v.animal_type)}`
              : '';

          return (
            <View key={v.id || i} style={[styles.dueCard, { borderLeftColor: urgencyColor }]}>
              <View style={styles.dueCardMain}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dueVaccineName}>{'\�\�'} {v.vaccine_name}</Text>
                  {animalDisplay ? <Text style={styles.dueAnimal}>{animalDisplay}</Text> : null}
                  <Text style={styles.dueDate}>Хугацаа: {v.next_due_date}</Text>
                </View>
                <View style={[styles.daysBadge, { backgroundColor: urgencyBg }]}>
                  <Text style={[styles.daysText, { color: urgencyColor }]}>
                    {isOverdue ? `${Math.abs(daysLeft)} хоног хэтэрсэн` : `${daysLeft} хоног`}
                  </Text>
                </View>
              </View>
            </View>
          );
        }) : <Text style={styles.emptyText}>Товлосон вакцин байхгүй</Text>}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>{'\�\�'} Эрүүл мэнд</Text></View>

      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor={AppColors.primary} />} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} /> : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {activeTab === 0 && renderHealth()}
            {activeTab === 1 && renderVaccinations()}
            {activeTab === 2 && renderSchedule()}
          </View>
        )}
        <AdBanner placement="health" />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== Health Record Modal ===== */}
      <Modal visible={showAddHealth} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingHealth ? 'Бүртгэл засах' : 'Бүртгэл нэмэх'}</Text>

              {/* Animal picker */}
              <Text style={styles.label}>Малаа сонгох</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => openAnimalPicker('health')}>
                <Text style={hAnimalId ? styles.pickerBtnTextSelected : styles.pickerBtnText}>
                  {hAnimalId ? getAnimalName(parseInt(hAnimalId)) : 'Мал сонгох...'}
                </Text>
              </TouchableOpacity>

              {/* Record type */}
              <Text style={styles.label}>Төрөл</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {recordTypes.map(rt => (
                    <TouchableOpacity key={rt.key} style={[styles.typeChip, hRecordType === rt.key && styles.typeChipActive]} onPress={() => setHRecordType(rt.key)}>
                      <Text style={hRecordType === rt.key ? styles.typeChipTextActive : undefined}>{rt.emoji} {rt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Нэр *</Text>
              <TextInput style={styles.input} value={hTitle} onChangeText={setHTitle} placeholder="Жнь: Хөл өвдөлт" placeholderTextColor={AppColors.gray} />

              <Text style={styles.label}>Тайлбар</Text>
              <TextInput style={[styles.input, styles.textArea]} value={hDescription} onChangeText={setHDescription} placeholder="Дэлгэрэнгүй тайлбар" placeholderTextColor={AppColors.gray} multiline numberOfLines={3} />

              <Text style={styles.label}>Онош</Text>
              <TextInput style={styles.input} value={hDiagnosis} onChangeText={setHDiagnosis} placeholder="Мал эмчийн онош" placeholderTextColor={AppColors.gray} />

              <Text style={styles.label}>Эмчилгээ</Text>
              <TextInput style={styles.input} value={hTreatment} onChangeText={setHTreatment} placeholder="Хийсэн эмчилгээ" placeholderTextColor={AppColors.gray} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Эм</Text>
                  <TextInput style={styles.input} value={hMedication} onChangeText={setHMedication} placeholder="Эмийн нэр" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Тун</Text>
                  <TextInput style={styles.input} value={hDosage} onChangeText={setHDosage} placeholder="5мл" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Мал эмч</Text>
                  <TextInput style={styles.input} value={hVetName} onChangeText={setHVetName} placeholder="Мал эмчийн нэр" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Зардал ({'\₮'})</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={hCost} onChangeText={setHCost} placeholder="50000" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Огноо *</Text>
                  <TextInput style={styles.input} value={hDate} onChangeText={setHDate} placeholder="2026-04-01" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Дараагийн үзлэг</Text>
                  <TextInput style={styles.input} value={hNextCheckup} onChangeText={setHNextCheckup} placeholder="2026-05-01" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              {/* Severity */}
              <Text style={styles.label}>Хүндийн зэрэг</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {severityLevels.map(sv => (
                  <TouchableOpacity
                    key={sv.key}
                    style={[styles.sevChip, hSeverity === sv.key && { borderColor: sv.color, backgroundColor: sv.color + '20' }]}
                    onPress={() => setHSeverity(sv.key)}
                  >
                    <View style={[styles.sevDot, { backgroundColor: sv.color }]} />
                    <Text style={[styles.sevChipText, hSeverity === sv.key && { color: sv.color, fontWeight: '700' }]}>{sv.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddHealth(false); resetHealthForm(); }}>
                  <Text style={styles.cancelText}>Болих</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHealth}>
                  <Text style={styles.saveText}>Хадгалах</Text>
                </TouchableOpacity>
              </View>

              {editingHealth && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { setShowAddHealth(false); handleDeleteHealth(editingHealth.id); }}>
                  <Text style={styles.deleteText}>Устгах</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ===== Vaccination Modal ===== */}
      <Modal visible={showAddVaccine} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingVaccine ? 'Вакцин засах' : 'Вакцин нэмэх'}</Text>

              {/* Mode toggle */}
              <Text style={styles.label}>Бүртгэлийн төрөл</Text>
              <View style={styles.modeToggle}>
                <TouchableOpacity style={[styles.modeBtn, vMode === 'individual' && styles.modeBtnActive]} onPress={() => setVMode('individual')}>
                  <Text style={[styles.modeBtnText, vMode === 'individual' && styles.modeBtnTextActive]}>Нэг мал</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, vMode === 'batch' && styles.modeBtnActive]} onPress={() => setVMode('batch')}>
                  <Text style={[styles.modeBtnText, vMode === 'batch' && styles.modeBtnTextActive]}>Бөөнөөр</Text>
                </TouchableOpacity>
              </View>

              {vMode === 'individual' ? (
                <>
                  <Text style={styles.label}>Малаа сонгох</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => openAnimalPicker('vaccine')}>
                    <Text style={vAnimalId ? styles.pickerBtnTextSelected : styles.pickerBtnText}>
                      {vAnimalId ? getAnimalName(parseInt(vAnimalId)) : 'Мал сонгох...'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Малын төрөл</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {animalTypes.map(at => (
                        <TouchableOpacity key={at.key} style={[styles.typeChip, vAnimalType === at.key && styles.typeChipActive]} onPress={() => setVAnimalType(at.key)}>
                          <Text style={vAnimalType === at.key ? styles.typeChipTextActive : undefined}>{at.emoji} {at.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={styles.label}>Малын тоо</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={vAnimalCount} onChangeText={setVAnimalCount} placeholder="50" placeholderTextColor={AppColors.gray} />
                </>
              )}

              <Text style={styles.label}>Вакцины нэр *</Text>
              <TextInput style={styles.input} value={vName} onChangeText={setVName} placeholder="Жнь: Шүлхий вакцин" placeholderTextColor={AppColors.gray} />

              <Text style={styles.label}>Өвчин</Text>
              <TextInput style={styles.input} value={vDisease} onChangeText={setVDisease} placeholder="Ямар өвчнөөс хамгаалах" placeholderTextColor={AppColors.gray} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Огноо *</Text>
                  <TextInput style={styles.input} value={vDate} onChangeText={setVDate} placeholder="2026-04-01" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Дараагийн огноо</Text>
                  <TextInput style={styles.input} value={vNextDue} onChangeText={setVNextDue} placeholder="2026-10-01" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Багцын дугаар</Text>
              <TextInput style={styles.input} value={vBatchNumber} onChangeText={setVBatchNumber} placeholder="LOT-2026-001" placeholderTextColor={AppColors.gray} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Хийсэн хүн</Text>
                  <TextInput style={styles.input} value={vAdministeredBy} onChangeText={setVAdministeredBy} placeholder="Мал эмчийн нэр" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Зардал ({'\₮'})</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={vCost} onChangeText={setVCost} placeholder="30000" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Тэмдэглэл</Text>
              <TextInput style={[styles.input, styles.textArea]} value={vNotes} onChangeText={setVNotes} placeholder="Нэмэлт тэмдэглэл" placeholderTextColor={AppColors.gray} multiline numberOfLines={3} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddVaccine(false); resetVaccineForm(); }}>
                  <Text style={styles.cancelText}>Болих</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVaccine}>
                  <Text style={styles.saveText}>Хадгалах</Text>
                </TouchableOpacity>
              </View>

              {editingVaccine && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { setShowAddVaccine(false); handleDeleteVaccine(editingVaccine.id); }}>
                  <Text style={styles.deleteText}>Устгах</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ===== Animal Picker Modal ===== */}
      <Modal visible={showAnimalPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Малаа сонгох</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {animals.length > 0 ? animals.map((a: any) => (
                <TouchableOpacity key={a.id} style={styles.animalPickerItem} onPress={() => selectAnimal(a)}>
                  <Text style={styles.animalPickerEmoji}>{getAnimalEmoji(a.type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.animalPickerName}>{a.name}</Text>
                    <Text style={styles.animalPickerType}>{getAnimalLabel(a.type)} {a.tag_number ? `· ${a.tag_number}` : ''}</Text>
                  </View>
                </TouchableOpacity>
              )) : <Text style={styles.emptyText}>Бүртгэлтэй мал байхгүй</Text>}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 12 }]} onPress={() => setShowAnimalPicker(false)}>
              <Text style={styles.cancelText}>Болих</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.black },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#e8ebe3', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  tabText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: '#2d5016', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.black, marginTop: 20, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: AppColors.gray, marginTop: 20, fontSize: 14 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: AppColors.black, marginTop: 4 },
  statLabel: { fontSize: 9, color: AppColors.grayDark, marginTop: 2, textAlign: 'center' },

  // Filter chips
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: AppColors.grayMedium, backgroundColor: '#FFF' },
  filterChipActive: { borderColor: '#2d5016', backgroundColor: '#e8f5e0' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  filterChipTextActive: { color: '#2d5016', fontWeight: '700' },

  // Add button
  addBtn: { backgroundColor: '#2d5016', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Record cards
  recordCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginTop: 8, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordAnimal: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  recordTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginTop: 4 },
  recordDiagnosis: { fontSize: 12, color: AppColors.grayDark, marginTop: 2, fontStyle: 'italic' },
  recordFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  recordDate: { fontSize: 11, color: AppColors.gray },
  recordCost: { fontSize: 13, fontWeight: '700', color: '#2d5016', marginLeft: 'auto' },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sevBadgeText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },

  // Vaccine cards
  vaccineCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginTop: 8, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  vaccineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vaccineCardName: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  vaccineCardCost: { fontSize: 13, fontWeight: '700', color: '#2d5016' },
  vaccineCardDisease: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  vaccineCardAnimal: { fontSize: 13, fontWeight: '600', color: '#4a7c28', marginTop: 4 },
  vaccineCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  vaccineCardDate: { fontSize: 11, color: AppColors.gray },
  vaccineCardNext: { fontSize: 11, color: AppColors.warning, fontWeight: '600' },
  vaccineCardVet: { fontSize: 11, color: AppColors.grayDark, marginTop: 4 },

  // Due/Schedule cards
  dueCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginTop: 8, borderLeftWidth: 4, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
  dueCardMain: { flexDirection: 'row', alignItems: 'center' },
  dueVaccineName: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  dueAnimal: { fontSize: 12, color: '#4a7c28', marginTop: 2 },
  dueDate: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  daysText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, fontSize: 15, color: AppColors.black, backgroundColor: '#FAFAFA' },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 10 },

  // Type chips
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, backgroundColor: '#FFF' },
  typeChipActive: { borderColor: '#2d5016', backgroundColor: '#e8f5e0' },
  typeChipTextActive: { color: '#2d5016', fontWeight: '700' },

  // Severity chips
  sevChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.grayMedium, backgroundColor: '#FFF', gap: 6 },
  sevDot: { width: 10, height: 10, borderRadius: 5 },
  sevChipText: { fontSize: 13, color: AppColors.grayDark },

  // Mode toggle
  modeToggle: { flexDirection: 'row', backgroundColor: '#e8ebe3', borderRadius: 10, padding: 3 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#FFF', elevation: 2, boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  modeBtnTextActive: { color: '#2d5016', fontWeight: '700' },

  // Picker button
  pickerBtn: { borderWidth: 1.5, borderColor: AppColors.grayMedium, borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
  pickerBtnText: { fontSize: 15, color: AppColors.gray },
  pickerBtnTextSelected: { fontSize: 15, color: AppColors.black },

  // Animal picker items
  animalPickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: AppColors.grayMedium, gap: 10 },
  animalPickerEmoji: { fontSize: 24 },
  animalPickerName: { fontSize: 15, fontWeight: '600', color: AppColors.black },
  animalPickerType: { fontSize: 12, color: AppColors.grayDark },

  // Action buttons
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.grayMedium, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: AppColors.grayDark },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2d5016', alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  deleteBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, backgroundColor: '#FFEBEE' },
  deleteText: { fontSize: 14, fontWeight: '700', color: AppColors.danger } });
