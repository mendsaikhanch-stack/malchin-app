import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { animalsApi, livestockApi } from '@/services/api';

const ONBOARDING_DATA_KEY = '@malchin_onboarding_data';

// Backend унасан үед онбординг-д бүртгэсэн малын тоог fallback болгон унших
async function loadFromOnboardingStorage(): Promise<{ livestock: any[]; total_animals: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d?.livestock) return null;
    const types = ['horse', 'cow', 'sheep', 'goat', 'camel'] as const;
    const items = types
      .filter((t) => (d.livestock[t] || 0) > 0)
      .map((t) => ({ animal_type: t, total_count: d.livestock[t] }));
    const total = items.reduce((s, i) => s + i.total_count, 0);
    return items.length > 0 ? { livestock: items, total_animals: total } : null;
  } catch {
    return null;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const animalTypes = [
  { key: 'sheep', label: 'Хонь', emoji: '🐑' },
  { key: 'goat', label: 'Ямаа', emoji: '🐐' },
  { key: 'cattle', label: 'Үхэр', emoji: '🐄' },
  { key: 'horse', label: 'Морь', emoji: '🐎' },
  { key: 'camel', label: 'Тэмээ', emoji: '🐫' },
];

const animalTypeMap: Record<string, string> = {
  sheep: 'Хонь', goat: 'Ямаа', cattle: 'Үхэр', horse: 'Морь', camel: 'Тэмээ',
};

const animalEmojiMap: Record<string, string> = {
  sheep: '🐑', goat: '🐐', cattle: '🐄', horse: '🐎', camel: '🐫',
};

const genderLabels: Record<string, string> = { male: 'Эр', female: 'Эм' };

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Идэвхтэй', bg: '#E8F5E9', color: '#2E7D32' },
  sold: { label: 'Зарагдсан', bg: '#FFF3E0', color: '#E65100' },
  dead: { label: 'Үхсэн', bg: '#FFEBEE', color: '#C62828' },
  slaughtered: { label: 'Нядалсан', bg: '#FBE9E7', color: '#BF360C' },
};

const originLabels: Record<string, string> = {
  own_birth: 'Өөрийн төл',
  purchased: 'Худалдаж авсан',
  gift: 'Бэлэг',
  exchange: 'Солилцсон',
};

const eventTypes = [
  { key: 'birth', label: 'Төрсөн', emoji: '🎉' },
  { key: 'death', label: 'Үхсэн', emoji: '☠️' },
  { key: 'sold', label: 'Зарсан', emoji: '💰' },
  { key: 'purchased', label: 'Авсан', emoji: '🛒' },
];

const tabs = ['Бүртгэл', 'Тоо толгой'];
const filterTypes = [{ key: '', label: 'Бүгд', emoji: '' }, ...animalTypes];

const getAnimalInfo = (type: string) =>
  animalTypes.find((a) => a.key === type) || { label: type, emoji: '🐾', key: type };

const getEventInfo = (type: string) =>
  eventTypes.find((e) => e.key === type) || { label: type, emoji: '📋', key: type };

function calcAge(birthDate: string): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return `${years} нас ${months} сар`;
  if (years > 0) return `${years} нас`;
  if (months > 0) return `${months} сар`;
  return 'Нярай';
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LivestockScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🐑 Мал бүртгэл</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 0 ? <IndividualAnimalsTab /> : <AggregateTab />}
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1: Individual Animals (Бүртгэл)
// ═════════════════════════════════════════════════════════════════════════════

function IndividualAnimalsTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterType, setFilterType] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState<any>(null);
  const [detailAnimal, setDetailAnimal] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const filters: any = {};
      if (filterType) filters.type = filterType;
      if (searchText.trim()) filters.search = searchText.trim();
      const [animalsRes, statsRes] = await Promise.allSettled([
        animalsApi.getAll(filters),
        animalsApi.getStats(),
      ]);
      if (animalsRes.status === 'fulfilled') {
        setAnimals(animalsRes.value?.animals || animalsRes.value || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value || null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, searchText]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (animal: any) => {
    const name = animal.name || getAnimalInfo(animal.animal_type).label;
    Alert.alert('Устгах', `"${name}" малыг устгах уу?`, [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Устгах',
        style: 'destructive',
        onPress: async () => {
          try {
            await animalsApi.delete(animal.id);
            loadData();
          } catch {
            Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
          }
        },
      },
    ]);
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await animalsApi.getById(id);
      setDetailAnimal(data);
    } catch {
      Alert.alert('Алдаа', 'Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalCount = stats?.total || animals.length;

  const renderAnimalCard = ({ item }: { item: any }) => {
    const info = getAnimalInfo(item.animal_type);
    const status = statusLabels[item.status] || statusLabels.active;
    return (
      <TouchableOpacity
        style={styles.animalListCard}
        onPress={() => openDetail(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.animalListRow}>
          <Text style={styles.animalListEmoji}>{info.emoji}</Text>
          <View style={styles.animalListInfo}>
            <View style={styles.animalListNameRow}>
              <Text style={styles.animalListName} numberOfLines={1}>
                {item.name || info.label}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.animalListMeta}>
              {info.label} · {genderLabels[item.gender] || item.gender || '—'}{item.breed ? ` · ${item.breed}` : ''}
            </Text>
            {item.ear_tag ? (
              <Text style={styles.animalListTag}>🏷️ {item.ear_tag}</Text>
            ) : null}
            {item.birth_date ? (
              <Text style={styles.animalListAge}>
                📅 {formatDate(item.birth_date)} ({calcAge(item.birth_date)})
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.animalListActions}>
          <TouchableOpacity
            style={styles.actionBtnEdit}
            onPress={() => {
              setEditAnimal(item);
              setShowAddModal(true);
            }}
          >
            <Text style={styles.actionBtnEditText}>✏️ Засах</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item)}>
            <Text style={styles.actionBtnDeleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Нийт</Text>
        </View>
        {animalTypes.map((at) => {
          const count = stats?.by_type?.[at.key] || 0;
          return (
            <View key={at.key} style={styles.statItem}>
              <Text style={styles.statNumber}>
                {at.emoji} {count}
              </Text>
              <Text style={styles.statLabel}>{at.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {filterTypes.map((ft) => (
            <TouchableOpacity
              key={ft.key}
              style={[styles.filterChip, filterType === ft.key && styles.filterChipActive]}
              onPress={() => setFilterType(ft.key)}
            >
              <Text style={[styles.filterChipText, filterType === ft.key && styles.filterChipTextActive]}>
                {ft.key ? `${ft.emoji} ` : ''}{ft.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Нэр, ээмэг, чип..."
          placeholderTextColor={AppColors.gray}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {/* Animal list */}
      {loading ? (
        <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAnimalCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 40 }}>🐾</Text>
              <Text style={styles.emptyTitle}>Мал бүртгэгдээгүй</Text>
              <Text style={styles.emptySubtitle}>Доорх товчийг дарж мал бүртгэнэ үү</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d5016" />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditAnimal(null);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Мал бүртгэх</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <AddEditAnimalModal
        visible={showAddModal}
        animal={editAnimal}
        allAnimals={animals}
        onClose={() => {
          setShowAddModal(false);
          setEditAnimal(null);
        }}
        onSaved={() => {
          setShowAddModal(false);
          setEditAnimal(null);
          loadData();
        }}
      />

      {/* Detail Modal */}
      <AnimalDetailModal
        animal={detailAnimal}
        loading={detailLoading}
        onClose={() => setDetailAnimal(null)}
        onEdit={(a: any) => {
          setDetailAnimal(null);
          setEditAnimal(a);
          setShowAddModal(true);
        }}
        onDeleted={() => {
          setDetailAnimal(null);
          loadData();
        }}
      />
    </View>
  );
}

// ─── Add / Edit Animal Modal ─────────────────────────────────────────────────

function AddEditAnimalModal({
  visible,
  animal,
  allAnimals,
  onClose,
  onSaved,
}: {
  visible: boolean;
  animal: any;
  allAnimals: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!animal;

  const [animalType, setAnimalType] = useState('sheep');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('female');
  const [birthDate, setBirthDate] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [earTag, setEarTag] = useState('');
  const [chipId, setChipId] = useState('');
  const [brandMark, setBrandMark] = useState('');
  const [origin, setOrigin] = useState('own_birth');
  const [motherId, setMotherId] = useState('');
  const [fatherId, setFatherId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (animal) {
      setAnimalType(animal.animal_type || 'sheep');
      setName(animal.name || '');
      setBreed(animal.breed || '');
      setGender(animal.gender || 'female');
      setBirthDate(animal.birth_date || '');
      setColor(animal.color || '');
      setWeight(animal.weight ? String(animal.weight) : '');
      setEarTag(animal.ear_tag || '');
      setChipId(animal.chip_id || '');
      setBrandMark(animal.brand_mark || '');
      setOrigin(animal.origin || 'own_birth');
      setMotherId(animal.mother_id ? String(animal.mother_id) : '');
      setFatherId(animal.father_id ? String(animal.father_id) : '');
      setNotes(animal.notes || '');
    } else {
      setAnimalType('sheep');
      setName('');
      setBreed('');
      setGender('female');
      setBirthDate('');
      setColor('');
      setWeight('');
      setEarTag('');
      setChipId('');
      setBrandMark('');
      setOrigin('own_birth');
      setMotherId('');
      setFatherId('');
      setNotes('');
    }
  }, [animal, visible]);

  const handleSave = async () => {
    if (!animalType) {
      Alert.alert('Алдаа', 'Малын төрөл сонгоно уу');
      return;
    }
    setSaving(true);
    const data: any = {
      animal_type: animalType,
      name: name.trim() || undefined,
      breed: breed.trim() || undefined,
      gender,
      birth_date: birthDate.trim() || undefined,
      color: color.trim() || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      ear_tag: earTag.trim() || undefined,
      chip_id: chipId.trim() || undefined,
      brand_mark: brandMark.trim() || undefined,
      origin,
      mother_id: motherId ? parseInt(motherId) : undefined,
      father_id: fatherId ? parseInt(fatherId) : undefined,
      notes: notes.trim() || undefined,
    };
    try {
      if (isEdit) {
        await animalsApi.update(animal.id, data);
      } else {
        await animalsApi.create(data);
      }
      onSaved();
    } catch {
      Alert.alert('Алдаа', isEdit ? 'Засахад алдаа гарлаа' : 'Бүртгэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  // Get potential parents (same type animals)
  const potentialParents = allAnimals.filter(
    (a) => a.animal_type === animalType && (!isEdit || a.id !== animal?.id)
  );
  const mothers = potentialParents.filter((a) => a.gender === 'female');
  const fathers = potentialParents.filter((a) => a.gender === 'male');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEdit ? '✏️ Мал засах' : '➕ Мал бүртгэх'}</Text>

            {/* Animal type */}
            <Text style={styles.label}>Малын төрөл *</Text>
            <View style={styles.typeSelector}>
              {animalTypes.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.typeBtn, animalType === a.key && styles.typeBtnActive]}
                  onPress={() => setAnimalType(a.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{a.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, animalType === a.key && styles.typeBtnLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name & Breed */}
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Нэр / Кличка</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Жнь: Цагаан"
                  placeholderTextColor={AppColors.gray}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Үүлдэр</Text>
                <TextInput
                  style={styles.input}
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="Жнь: Байдраг"
                  placeholderTextColor={AppColors.gray}
                />
              </View>
            </View>

            {/* Gender */}
            <Text style={styles.label}>Хүйс *</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>♂ Эр</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>♀ Эм</Text>
              </TouchableOpacity>
            </View>

            {/* Birth date */}
            <Text style={styles.label}>Төрсөн огноо</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="2024-03-15"
              placeholderTextColor={AppColors.gray}
            />

            {/* Color & Weight */}
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Зүс / Өнгө</Text>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Цагаан"
                  placeholderTextColor={AppColors.gray}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Жин (кг)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="45"
                  placeholderTextColor={AppColors.gray}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Tags */}
            <Text style={styles.label}>Ээмэг дугаар</Text>
            <TextInput
              style={styles.input}
              value={earTag}
              onChangeText={setEarTag}
              placeholder="MN-001-2024"
              placeholderTextColor={AppColors.gray}
            />

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Чип дугаар</Text>
                <TextInput
                  style={styles.input}
                  value={chipId}
                  onChangeText={setChipId}
                  placeholder="CHIP-001"
                  placeholderTextColor={AppColors.gray}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Тамга</Text>
                <TextInput
                  style={styles.input}
                  value={brandMark}
                  onChangeText={setBrandMark}
                  placeholder="🔥 Б"
                  placeholderTextColor={AppColors.gray}
                />
              </View>
            </View>

            {/* Origin */}
            <Text style={styles.label}>Гарал</Text>
            <View style={styles.typeSelector}>
              {Object.entries(originLabels).map(([key, lbl]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.originBtn, origin === key && styles.originBtnActive]}
                  onPress={() => setOrigin(key)}
                >
                  <Text style={[styles.originBtnText, origin === key && styles.originBtnTextActive]}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mother / Father pickers (simple text-based ID) */}
            {mothers.length > 0 && (
              <>
                <Text style={styles.label}>Эх (сонголт)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <TouchableOpacity
                    style={[styles.parentChip, !motherId && styles.parentChipActive]}
                    onPress={() => setMotherId('')}
                  >
                    <Text style={[styles.parentChipText, !motherId && styles.parentChipTextActive]}>Сонгоогүй</Text>
                  </TouchableOpacity>
                  {mothers.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.parentChip, motherId === String(m.id) && styles.parentChipActive]}
                      onPress={() => setMotherId(String(m.id))}
                    >
                      <Text style={[styles.parentChipText, motherId === String(m.id) && styles.parentChipTextActive]}>
                        {m.name || m.ear_tag || `#${m.id}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {fathers.length > 0 && (
              <>
                <Text style={styles.label}>Эцэг (сонголт)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <TouchableOpacity
                    style={[styles.parentChip, !fatherId && styles.parentChipActive]}
                    onPress={() => setFatherId('')}
                  >
                    <Text style={[styles.parentChipText, !fatherId && styles.parentChipTextActive]}>Сонгоогүй</Text>
                  </TouchableOpacity>
                  {fathers.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.parentChip, fatherId === String(f.id) && styles.parentChipActive]}
                      onPress={() => setFatherId(String(f.id))}
                    >
                      <Text style={[styles.parentChipText, fatherId === String(f.id) && styles.parentChipTextActive]}>
                        {f.name || f.ear_tag || `#${f.id}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Notes */}
            <Text style={styles.label}>Тэмдэглэл</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Нэмэлт тэмдэглэл..."
              placeholderTextColor={AppColors.gray}
              multiline
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{isEdit ? 'Хадгалах' : 'Бүртгэх'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Animal Detail Modal ─────────────────────────────────────────────────────

function AnimalDetailModal({
  animal,
  loading,
  onClose,
  onEdit,
  onDeleted,
}: {
  animal: any;
  loading: boolean;
  onClose: () => void;
  onEdit: (a: any) => void;
  onDeleted: () => void;
}) {
  if (!animal && !loading) return null;

  const handleDelete = () => {
    if (!animal) return;
    Alert.alert('Устгах', `"${animal.name || 'Энэ мал'}" малыг устгах уу?`, [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Устгах',
        style: 'destructive',
        onPress: async () => {
          try {
            await animalsApi.delete(animal.id);
            onDeleted();
          } catch {
            Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
          }
        },
      },
    ]);
  };

  const info = animal ? getAnimalInfo(animal.animal_type) : null;
  const status = animal ? statusLabels[animal.status] || statusLabels.active : null;

  return (
    <Modal visible={!!animal || loading} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2d5016" />
              <Text style={{ marginTop: 12, color: AppColors.grayDark }}>Ачаалж байна...</Text>
            </View>
          ) : animal ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.detailHeader}>
                <Text style={{ fontSize: 48 }}>{info?.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.detailName}>{animal.name || info?.label}</Text>
                  <Text style={styles.detailMeta}>
                    {info?.label} · {genderLabels[animal.gender] || '—'}
                    {animal.breed ? ` · ${animal.breed}` : ''}
                  </Text>
                  {status && (
                    <View style={[styles.statusBadge, { backgroundColor: status.bg, alignSelf: 'flex-start', marginTop: 4 }]}>
                      <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Info grid */}
              <View style={styles.detailGrid}>
                {animal.ear_tag && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Ээмэг</Text>
                    <Text style={styles.detailGridValue}>{animal.ear_tag}</Text>
                  </View>
                )}
                {animal.chip_id && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Чип</Text>
                    <Text style={styles.detailGridValue}>{animal.chip_id}</Text>
                  </View>
                )}
                {animal.birth_date && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Төрсөн</Text>
                    <Text style={styles.detailGridValue}>{formatDate(animal.birth_date)}</Text>
                  </View>
                )}
                {animal.birth_date && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Нас</Text>
                    <Text style={styles.detailGridValue}>{calcAge(animal.birth_date)}</Text>
                  </View>
                )}
                {animal.color && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Зүс</Text>
                    <Text style={styles.detailGridValue}>{animal.color}</Text>
                  </View>
                )}
                {animal.weight && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Жин</Text>
                    <Text style={styles.detailGridValue}>{animal.weight} кг</Text>
                  </View>
                )}
                {animal.brand_mark && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Тамга</Text>
                    <Text style={styles.detailGridValue}>{animal.brand_mark}</Text>
                  </View>
                )}
                {animal.origin && (
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Гарал</Text>
                    <Text style={styles.detailGridValue}>{originLabels[animal.origin] || animal.origin}</Text>
                  </View>
                )}
              </View>

              {/* Genealogy */}
              {(animal.mother || animal.father || (animal.offspring && animal.offspring.length > 0)) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🧬 Удам угсаа</Text>
                  {animal.mother && (
                    <View style={styles.genealogyItem}>
                      <Text style={styles.genealogyRole}>Эх:</Text>
                      <Text style={styles.genealogyName}>
                        {animalEmojiMap[animal.mother.animal_type] || '🐾'}{' '}
                        {animal.mother.name || animal.mother.ear_tag || `#${animal.mother.id}`}
                      </Text>
                    </View>
                  )}
                  {animal.father && (
                    <View style={styles.genealogyItem}>
                      <Text style={styles.genealogyRole}>Эцэг:</Text>
                      <Text style={styles.genealogyName}>
                        {animalEmojiMap[animal.father.animal_type] || '🐾'}{' '}
                        {animal.father.name || animal.father.ear_tag || `#${animal.father.id}`}
                      </Text>
                    </View>
                  )}
                  {animal.offspring && animal.offspring.length > 0 && (
                    <>
                      <Text style={[styles.genealogyRole, { marginTop: 8 }]}>
                        Төлүүд ({animal.offspring.length}):
                      </Text>
                      {animal.offspring.map((o: any) => (
                        <View key={o.id} style={styles.genealogyItem}>
                          <Text style={styles.genealogyName}>
                            {animalEmojiMap[o.animal_type] || '🐾'}{' '}
                            {o.name || o.ear_tag || `#${o.id}`}
                            {o.birth_date ? ` (${formatDate(o.birth_date)})` : ''}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {/* Health records */}
              {animal.health_records && animal.health_records.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🏥 Эрүүл мэндийн бүртгэл</Text>
                  {animal.health_records.slice(0, 5).map((h: any) => (
                    <View key={h.id} style={styles.healthItem}>
                      <Text style={styles.healthTitle}>{h.title}</Text>
                      <Text style={styles.healthMeta}>
                        {h.record_type} · {formatDate(h.record_date)}
                        {h.diagnosis ? ` · ${h.diagnosis}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Vaccinations */}
              {animal.vaccinations && animal.vaccinations.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>💉 Вакцинжуулалт</Text>
                  {animal.vaccinations.slice(0, 5).map((v: any, idx: number) => (
                    <View key={v.id || idx} style={styles.healthItem}>
                      <Text style={styles.healthTitle}>{v.vaccine_name}</Text>
                      <Text style={styles.healthMeta}>
                        {formatDate(v.vaccination_date)}
                        {v.next_vaccination ? ` · Дараах: ${formatDate(v.next_vaccination)}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              {animal.notes ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📝 Тэмдэглэл</Text>
                  <Text style={styles.notesText}>{animal.notes}</Text>
                </View>
              ) : null}

              {/* Action buttons */}
              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.detailEditBtn} onPress={() => onEdit(animal)}>
                  <Text style={styles.detailEditBtnText}>✏️ Засах</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailDeleteBtn} onPress={handleDelete}>
                  <Text style={styles.detailDeleteBtnText}>🗑️ Устгах</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕ Хаах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2: Aggregate Counts (Тоо толгой) - original functionality
// ═════════════════════════════════════════════════════════════════════════════

function AggregateTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('sheep');
  const [count, setCount] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('birth');
  const [eventQuantity, setEventQuantity] = useState('');
  const [eventNote, setEventNote] = useState('');

  const userId = 1;

  const loadData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.allSettled([
        livestockApi.getStats(userId),
        livestockApi.getEvents(userId),
      ]);
      let stats: { livestock: any[]; total_animals: number } | null = null;
      if (statsRes.status === 'fulfilled' && (statsRes.value?.total_animals || 0) > 0) {
        stats = statsRes.value;
      } else {
        stats = await loadFromOnboardingStorage();
      }
      if (stats) {
        setLivestock(stats.livestock);
        setTotalAnimals(stats.total_animals);
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents((eventsRes.value || []).slice(0, 10));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAdd = async () => {
    const num = parseInt(count);
    if (!num || num <= 0) {
      Alert.alert('Алдаа', 'Тоо оруулна уу');
      return;
    }
    try {
      await livestockApi.add({ user_id: userId, animal_type: selectedAnimal, total_count: num });
      setShowAddModal(false);
      setCount('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Мал нэмэхэд алдаа гарлаа');
    }
  };

  const handleEvent = async () => {
    const num = parseInt(eventQuantity);
    if (!num || num <= 0) {
      Alert.alert('Алдаа', 'Тоо оруулна уу');
      return;
    }
    try {
      await livestockApi.addEvent({
        user_id: userId,
        animal_type: selectedAnimal,
        event_type: selectedEvent,
        quantity: num,
        note: eventNote,
      });
      setShowEventModal(false);
      setEventQuantity('');
      setEventNote('');
      loadData();
    } catch {
      Alert.alert('Алдаа', 'Үйл явдал бүртгэхэд алдаа гарлаа');
    }
  };

  const getAnimalInfoOld = (type: string) =>
    animalTypes.find((a) => a.key === type) || { label: type, emoji: '🐾' };
  const getEventInfoOld = (type: string) =>
    eventTypes.find((e) => e.key === type) || { label: type, emoji: '📋' };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d5016" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.aggSubtitle}>
              <Text style={styles.subtitle}>Нийт: {totalAnimals} толгой</Text>
            </View>

            {/* Animal grid */}
            <View style={styles.grid}>
              {animalTypes.map((animal) => {
                const data = livestock.find((l: any) => l.animal_type === animal.key);
                const animalCount = data?.total_count || 0;
                return (
                  <View key={animal.key} style={styles.aggAnimalCard}>
                    <Text style={styles.aggAnimalEmoji}>{animal.emoji}</Text>
                    <Text style={styles.aggAnimalCount}>{animalCount}</Text>
                    <Text style={styles.aggAnimalLabel}>{animal.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={styles.aggActions}>
              <TouchableOpacity style={styles.aggAddBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.aggAddBtnText}>+ Мал нэмэх</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aggAddBtn, { backgroundColor: AppColors.accent }]}
                onPress={() => setShowEventModal(true)}
              >
                <Text style={styles.aggAddBtnText}>📋 Үйл явдал</Text>
              </TouchableOpacity>
            </View>

            {/* Events */}
            <View style={styles.aggSection}>
              <Text style={styles.aggSectionTitle}>Сүүлийн үйл явдлууд</Text>
              {events.length > 0 ? (
                events.map((event: any, idx: number) => {
                  const animalInf = getAnimalInfoOld(event.animal_type);
                  const evt = getEventInfoOld(event.event_type);
                  return (
                    <View key={idx} style={styles.aggEventItem}>
                      <Text style={styles.aggEventEmoji}>{evt.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.aggEventText}>
                          {animalInf.emoji} {animalInf.label} - {evt.label} ({event.quantity})
                        </Text>
                        {event.note ? <Text style={styles.aggEventNote}>{event.note}</Text> : null}
                        <Text style={styles.aggEventDate}>{event.date}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Үйл явдал бүртгэгдээгүй байна</Text>
              )}
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Add count modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Мал нэмэх</Text>

            <Text style={styles.label}>Малын төрөл</Text>
            <View style={styles.typeSelector}>
              {animalTypes.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.typeBtn, selectedAnimal === a.key && styles.typeBtnActive]}
                  onPress={() => setSelectedAnimal(a.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{a.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedAnimal === a.key && styles.typeBtnLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Тоо толгой</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={count}
              onChangeText={setCount}
              placeholder="Жнь: 50"
              placeholderTextColor={AppColors.gray}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Хадгалах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event modal */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Үйл явдал бүртгэх</Text>

            <Text style={styles.label}>Малын төрөл</Text>
            <View style={styles.typeSelector}>
              {animalTypes.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.typeBtn, selectedAnimal === a.key && styles.typeBtnActive]}
                  onPress={() => setSelectedAnimal(a.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{a.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedAnimal === a.key && styles.typeBtnLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Үйл явдлын төрөл</Text>
            <View style={styles.typeSelector}>
              {eventTypes.map((e) => (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.typeBtn, selectedEvent === e.key && styles.typeBtnActive]}
                  onPress={() => setSelectedEvent(e.key)}
                >
                  <Text style={styles.typeBtnEmoji}>{e.emoji}</Text>
                  <Text style={[styles.typeBtnLabel, selectedEvent === e.key && styles.typeBtnLabelActive]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Тоо</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={eventQuantity}
              onChangeText={setEventQuantity}
              placeholder="Жнь: 5"
              placeholderTextColor={AppColors.gray}
            />

            <Text style={styles.label}>Тэмдэглэл</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={eventNote}
              onChangeText={setEventNote}
              placeholder="Нэмэлт тэмдэглэл..."
              placeholderTextColor={AppColors.gray}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEventModal(false)}>
                <Text style={styles.cancelBtnText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEvent}>
                <Text style={styles.saveBtnText}>Бүртгэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Layout ──
  container: { flex: 1, backgroundColor: '#f5f7f0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: AppColors.grayDark, marginTop: 2 },

  // ── Tab bar ──
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#e8ede0',
    borderRadius: 12,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: '#2d5016', fontWeight: '700' },

  // ── Stats bar (Tab 1) ──
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 14, fontWeight: '800', color: '#2d5016' },
  statLabel: { fontSize: 10, color: AppColors.grayDark, marginTop: 1 },

  // ── Filter row ──
  filterRow: { marginTop: 8 },
  filterChips: { paddingHorizontal: 16, gap: 6 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
  },
  filterChipActive: { backgroundColor: '#2d5016', borderColor: '#2d5016' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  filterChipTextActive: { color: '#fff' },

  // ── Search ──
  searchRow: { paddingHorizontal: 16, marginTop: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
  },

  // ── Animal list cards ──
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  animalListCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  animalListRow: { flexDirection: 'row', alignItems: 'flex-start' },
  animalListEmoji: { fontSize: 36, marginRight: 12 },
  animalListInfo: { flex: 1 },
  animalListNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  animalListName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1, marginRight: 8 },
  animalListMeta: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  animalListTag: { fontSize: 11, color: '#4a7c28', marginTop: 3 },
  animalListAge: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  animalListActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  actionBtnEdit: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  actionBtnEditText: { fontSize: 12, fontWeight: '600', color: '#2d5016' },
  actionBtnDelete: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  actionBtnDeleteText: { fontSize: 12 },

  // ── Status badge ──
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 16,
    right: 20,
    left: 20,
    backgroundColor: '#2d5016',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Empty state ──
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.grayDark, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: AppColors.gray, marginTop: 4 },
  emptyText: {
    fontSize: 14,
    color: AppColors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // ── Modal shared ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginBottom: 6, marginTop: 12 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#2d5016', backgroundColor: '#E8F5E9' },
  typeBtnEmoji: { fontSize: 20 },
  typeBtnLabel: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  typeBtnLabelActive: { color: '#2d5016', fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
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
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2d5016', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Form helpers ──
  formRow: { flexDirection: 'row', gap: 12 },
  formHalf: { flex: 1 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
    alignItems: 'center',
  },
  genderBtnActive: { borderColor: '#2d5016', backgroundColor: '#E8F5E9' },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },
  genderBtnTextActive: { color: '#2d5016' },
  originBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium,
  },
  originBtnActive: { borderColor: '#2d5016', backgroundColor: '#E8F5E9' },
  originBtnText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  originBtnTextActive: { color: '#2d5016' },
  parentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.grayMedium,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  parentChipActive: { borderColor: '#2d5016', backgroundColor: '#E8F5E9' },
  parentChipText: { fontSize: 12, color: AppColors.grayDark },
  parentChipTextActive: { color: '#2d5016', fontWeight: '600' },

  // ── Detail modal ──
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  detailMeta: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailGridItem: {
    backgroundColor: '#f5f7f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '45%',
    flexGrow: 1,
  },
  detailGridLabel: { fontSize: 10, color: AppColors.gray, fontWeight: '600', textTransform: 'uppercase' },
  detailGridValue: { fontSize: 14, fontWeight: '700', color: '#2d5016', marginTop: 2 },
  detailSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  genealogyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 8 },
  genealogyRole: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginRight: 6 },
  genealogyName: { fontSize: 13, color: '#2d5016', fontWeight: '600' },
  healthItem: {
    backgroundColor: '#f5f7f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  healthTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  healthMeta: { fontSize: 11, color: AppColors.grayDark, marginTop: 2 },
  notesText: { fontSize: 13, color: AppColors.grayDark, lineHeight: 20 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  detailEditBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  detailEditBtnText: { fontSize: 14, fontWeight: '700', color: '#2d5016' },
  detailDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  detailDeleteBtnText: { fontSize: 14, fontWeight: '700', color: '#C62828' },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.grayDark },

  // ── Aggregate tab (Tab 2) ──
  aggSubtitle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
  },
  aggAnimalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  aggAnimalEmoji: { fontSize: 36 },
  aggAnimalCount: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginTop: 6 },
  aggAnimalLabel: { fontSize: 13, color: AppColors.grayDark, marginTop: 2 },
  aggActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  aggAddBtn: {
    flex: 1,
    backgroundColor: '#2d5016',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  aggAddBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  aggSection: { paddingHorizontal: 16, marginTop: 24 },
  aggSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  aggEventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  aggEventEmoji: { fontSize: 24, marginRight: 12 },
  aggEventText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  aggEventNote: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  aggEventDate: { fontSize: 11, color: AppColors.gray, marginTop: 4 },
});
