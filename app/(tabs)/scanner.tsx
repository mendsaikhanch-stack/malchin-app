import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { animalsApi } from '@/services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const animalTypes: Record<string, { label: string; emoji: string }> = {
  sheep: { label: 'Хонь', emoji: '🐑' },
  goat: { label: 'Ямаа', emoji: '🐐' },
  cattle: { label: 'Үхэр', emoji: '🐄' },
  horse: { label: 'Морь', emoji: '🐎' },
  camel: { label: 'Тэмээ', emoji: '🐫' },
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

const severityLabels: Record<string, { label: string; bg: string; color: string }> = {
  low: { label: 'Хөнгөн', bg: '#E8F5E9', color: '#2E7D32' },
  medium: { label: 'Дунд', bg: '#FFF3E0', color: '#E65100' },
  high: { label: 'Хүнд', bg: '#FFEBEE', color: '#C62828' },
  critical: { label: 'Маш хүнд', bg: '#F3E5F5', color: '#6A1B9A' },
};

function getAnimalInfo(type: string) {
  return animalTypes[type] || { label: type, emoji: '🐾' };
}

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

export default function ScannerScreen() {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [animal, setAnimal] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [recentLookups, setRecentLookups] = useState<{ tag: string; name: string; emoji: string }[]>([]);

  const handleSearch = useCallback(async (tag?: string) => {
    const query = (tag || searchText).trim();
    if (!query) {
      Alert.alert('Анхааруулга', 'Ээмэг эсвэл чипний дугаар оруулна уу');
      return;
    }

    setLoading(true);
    setAnimal(null);
    setNotFound(false);

    try {
      // Step 1: lookup by tag/chip
      const lookupResult = await animalsApi.lookup(query);
      if (!lookupResult || (!lookupResult.id && !lookupResult.animal)) {
        setNotFound(true);
        return;
      }

      const animalData = lookupResult.animal || lookupResult;

      // Step 2: get full details with genealogy, health, vaccinations
      let fullData = animalData;
      if (animalData.id) {
        try {
          const detailed = await animalsApi.getById(animalData.id);
          if (detailed) {
            fullData = detailed.animal || detailed;
          }
        } catch {
          // Use lookup data if getById fails
        }
      }

      setAnimal(fullData);

      // Add to recent lookups
      const info = getAnimalInfo(fullData.animal_type);
      const newEntry = {
        tag: query,
        name: fullData.name || info.label,
        emoji: info.emoji,
      };
      setRecentLookups((prev) => {
        const filtered = prev.filter((r) => r.tag !== query);
        return [newEntry, ...filtered].slice(0, 5);
      });
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404') || err?.message?.includes('not found')) {
        setNotFound(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Мал хайх</Text>
          <Text style={styles.subtitle}>
            Ээмэгний дугаар эсвэл RFID чипний дугаар оруулж малаа хайна уу
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🏷️</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Ээмэг/чип дугаар оруулна уу"
                placeholderTextColor={AppColors.gray}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => handleSearch()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Хайх</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Future scanner button */}
          <TouchableOpacity style={styles.scannerButton} disabled activeOpacity={1}>
            <Text style={styles.scannerButtonText}>📷 Сканнер</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Удахгүй</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Lookups */}
        {recentLookups.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Сүүлд хайсан</Text>
            <View style={styles.recentChips}>
              {recentLookups.map((item) => (
                <TouchableOpacity
                  key={item.tag}
                  style={styles.recentChip}
                  onPress={() => {
                    setSearchText(item.tag);
                    handleSearch(item.tag);
                  }}
                >
                  <Text style={styles.recentChipText}>
                    {item.emoji} {item.tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color="#2d5016" />
            <Text style={styles.loadingText}>Хайж байна...</Text>
          </View>
        )}

        {/* Not Found */}
        {notFound && !loading && (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundEmoji}>🔍</Text>
            <Text style={styles.notFoundTitle}>Олдсонгүй</Text>
            <Text style={styles.notFoundText}>
              Энэ дугаартай мал бүртгэлд олдсонгүй. Шинэ мал бүртгэхийг хүсвэл мал бүртгэл хэсэгт очно уу.
            </Text>
          </View>
        )}

        {/* Animal Result Card */}
        {animal && !loading && <AnimalDetailCard animal={animal} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Animal Detail Card ──────────────────────────────────────────────────────

function AnimalDetailCard({ animal }: { animal: any }) {
  const info = getAnimalInfo(animal.animal_type);
  const status = statusLabels[animal.status] || statusLabels.active;
  const genealogy = animal.genealogy || {};
  const healthRecords = (animal.health_records || animal.healthRecords || []).slice(0, 3);
  const vaccinations = (animal.vaccinations || []).slice(0, 3);
  const offspring = genealogy.offspring || animal.offspring || [];

  return (
    <View style={styles.resultCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{info.emoji}</Text>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardName}>{animal.name || info.label}</Text>
          <Text style={styles.cardType}>{info.label}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <InfoGridItem label="Төрөл" value={info.label} />
        <InfoGridItem label="Үүлдэр" value={animal.breed || '—'} />
        <InfoGridItem label="Хүйс" value={genderLabels[animal.gender] || animal.gender || '—'} />
        <InfoGridItem label="Нас" value={animal.birth_date ? calcAge(animal.birth_date) : '—'} />
        <InfoGridItem label="Өнгө" value={animal.color || '—'} />
        <InfoGridItem label="Жин" value={animal.weight ? `${animal.weight} кг` : '—'} />
        <InfoGridItem label="Ээмэг" value={animal.ear_tag || '—'} />
        <InfoGridItem label="Чип" value={animal.chip_id || '—'} />
        <InfoGridItem label="Им" value={animal.brand_mark || '—'} />
        <InfoGridItem label="Гарал үүсэл" value={originLabels[animal.origin] || animal.origin || '—'} />
      </View>

      {/* Genealogy */}
      {(genealogy.mother || genealogy.father || offspring.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧬 Удам угсаа</Text>
          {genealogy.mother && (
            <View style={styles.genealogyRow}>
              <Text style={styles.genealogyRole}>Эх:</Text>
              <Text style={styles.genealogyName}>
                {genealogy.mother.name || 'Нэргүй'}
                {genealogy.mother.ear_tag ? ` (${genealogy.mother.ear_tag})` : ''}
              </Text>
            </View>
          )}
          {genealogy.father && (
            <View style={styles.genealogyRow}>
              <Text style={styles.genealogyRole}>Эцэг:</Text>
              <Text style={styles.genealogyName}>
                {genealogy.father.name || 'Нэргүй'}
                {genealogy.father.ear_tag ? ` (${genealogy.father.ear_tag})` : ''}
              </Text>
            </View>
          )}
          <View style={styles.genealogyRow}>
            <Text style={styles.genealogyRole}>Төлүүд:</Text>
            <Text style={styles.genealogyName}>
              {offspring.length > 0 ? `${offspring.length} төл` : 'Төлгүй'}
            </Text>
          </View>
        </View>
      )}

      {/* Health Records */}
      {healthRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 Эрүүл мэндийн бүртгэл</Text>
          {healthRecords.map((record: any, index: number) => {
            const severity = severityLabels[record.severity] || null;
            return (
              <View key={record.id || index} style={styles.healthItem}>
                <View style={styles.healthItemHeader}>
                  <Text style={styles.healthItemTitle} numberOfLines={1}>
                    {record.title || record.record_type || 'Бүртгэл'}
                  </Text>
                  {severity && (
                    <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
                      <Text style={[styles.severityBadgeText, { color: severity.color }]}>
                        {severity.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.healthItemDate}>
                  📅 {formatDate(record.record_date || record.date)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Vaccinations */}
      {vaccinations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💉 Вакцинжуулалт</Text>
          {vaccinations.map((vac: any, index: number) => (
            <View key={vac.id || index} style={styles.vaccinationItem}>
              <Text style={styles.vaccinationName}>
                {vac.vaccine_name || vac.name || 'Вакцин'}
              </Text>
              <Text style={styles.vaccinationDate}>
                📅 {formatDate(vac.vaccination_date || vac.date)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert('Мэдээлэл', 'Мал бүртгэл дэлгэц рүү очно уу')}
        >
          <Text style={styles.editButtonText}>✏️ Засах</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.healthButton}
          onPress={() => Alert.alert('Мэдээлэл', 'Эрүүл мэнд дэлгэц рүү очно уу')}
        >
          <Text style={styles.healthButtonText}>🏥 Эрүүл мэнд нэмэх</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Info Grid Item ──────────────────────────────────────────────────────────

function InfoGridItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoGridItem}>
      <Text style={styles.infoGridLabel}>{label}</Text>
      <Text style={styles.infoGridValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginTop: 4,
    lineHeight: 18,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e0e8d8',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#2d5016',
    borderRadius: 14,
    paddingHorizontal: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2d5016',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Scanner Button
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8ede2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#d0d9c6',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  scannerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginRight: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#4a7c28',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Recent Lookups
  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 8,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d0d9c6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d5016',
  },

  // Center Message
  centerMessage: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.grayDark,
    marginTop: 12,
  },

  // Not Found
  notFoundCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: AppColors.grayDark,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Result Card
  resultCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardType: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoGridItem: {
    backgroundColor: '#f5f7f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '45%',
    flexGrow: 1,
  },
  infoGridLabel: {
    fontSize: 10,
    color: AppColors.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoGridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d5016',
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },

  // Genealogy
  genealogyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 8,
  },
  genealogyRole: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginRight: 6,
    width: 50,
  },
  genealogyName: {
    fontSize: 13,
    color: '#2d5016',
    fontWeight: '600',
    flex: 1,
  },

  // Health Records
  healthItem: {
    backgroundColor: '#f5f7f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  healthItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  healthItemDate: {
    fontSize: 11,
    color: AppColors.grayDark,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Vaccinations
  vaccinationItem: {
    backgroundColor: '#f5f7f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  vaccinationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  vaccinationDate: {
    fontSize: 11,
    color: AppColors.grayDark,
    marginTop: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d5016',
  },
  healthButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  healthButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
});
