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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
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
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [animal, setAnimal] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [recentLookups, setRecentLookups] = useState<{ tag: string; name: string; emoji: string }[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  const lookupAnimal = async (query: string) => {
    try {
      const lookupResult = await animalsApi.lookup(query);
      if (!lookupResult || (!lookupResult.id && !lookupResult.animal)) return null;
      const animalData = lookupResult.animal || lookupResult;
      let fullData = animalData;
      if (animalData.id) {
        try {
          const detailed = await animalsApi.getById(animalData.id);
          if (detailed) fullData = detailed.animal || detailed;
        } catch {}
      }
      return fullData;
    } catch {
      return null;
    }
  };

  const handleSearch = useCallback(async (tag?: string) => {
    const query = (tag || searchText).trim();
    if (!query) {
      Alert.alert('Анхааруулга', 'Ээмэг эсвэл чипний дугаар оруулна уу');
      return;
    }

    setLoading(true);

    if (batchMode) {
      // Batch mode: олон дугаарыг таслалаар тусгаарлан хайна
      const tags = query.split(/[,;\s\n]+/).filter(Boolean);
      const results: any[] = [];
      for (const t of tags) {
        const result = await lookupAnimal(t.trim());
        results.push({ tag: t.trim(), animal: result, found: !!result });
      }
      setBatchResults(results);
      setLoading(false);
      return;
    }

    setAnimal(null);
    setNotFound(false);

    const fullData = await lookupAnimal(query);
    if (fullData) {
      setAnimal(fullData);
      const info = getAnimalInfo(fullData.animal_type);
      const newEntry = { tag: query, name: fullData.name || info.label, emoji: info.emoji };
      setRecentLookups((prev) => {
        const filtered = prev.filter((r) => r.tag !== query);
        return [newEntry, ...filtered].slice(0, 5);
      });
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [searchText, batchMode]);

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
                placeholder={batchMode ? "Дугааруудыг таслалаар тусгаарлана (жнь: MN001, MN002)" : "Ээмэг/чип дугаар оруулна уу"}
                placeholderTextColor={AppColors.gray}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
                autoCapitalize="characters"
                autoCorrect={false}
                multiline={batchMode}
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

          {/* Batch mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, !batchMode && styles.modeBtnActive]}
              onPress={() => { setBatchMode(false); setBatchResults([]); }}
            >
              <Text style={[styles.modeBtnText, !batchMode && styles.modeBtnTextActive]}>🔍 Нэг хайлт</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, batchMode && styles.modeBtnActive]}
              onPress={() => { setBatchMode(true); setAnimal(null); setNotFound(false); }}
            >
              <Text style={[styles.modeBtnText, batchMode && styles.modeBtnTextActive]}>📋 Олон хайлт</Text>
            </TouchableOpacity>
          </View>
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
        {animal && !loading && <AnimalDetailCard animal={animal} router={router} />}

        {/* Batch Results */}
        {batchMode && batchResults.length > 0 && !loading && (
          <View style={styles.batchSection}>
            <Text style={styles.batchTitle}>
              📋 Хайлтын үр дүн ({batchResults.filter(r => r.found).length}/{batchResults.length} олдсон)
            </Text>
            {batchResults.map((r, i) => {
              const info = r.animal ? getAnimalInfo(r.animal.animal_type) : { emoji: '❓', label: '' };
              const status = r.animal ? (statusLabels[r.animal.status] || statusLabels.active) : null;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.batchItem, !r.found && styles.batchItemNotFound]}
                  onPress={() => {
                    if (r.found) {
                      setBatchMode(false);
                      setAnimal(r.animal);
                      setSearchText(r.tag);
                    }
                  }}
                >
                  <Text style={styles.batchEmoji}>{r.found ? info.emoji : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.batchTag}>{r.tag}</Text>
                    {r.found ? (
                      <Text style={styles.batchInfo}>
                        {r.animal.name || info.label} · {r.animal.breed || ''} · {genderLabels[r.animal.gender] || ''}
                      </Text>
                    ) : (
                      <Text style={styles.batchNotFoundText}>Олдсонгүй</Text>
                    )}
                  </View>
                  {status && (
                    <View style={[styles.batchStatusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.batchStatusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Шуурхай үйлдлүүд */}
        {!animal && !loading && !notFound && batchResults.length === 0 && (
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>⚡ Шуурхай үйлдлүүд</Text>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/livestock')}>
              <Text style={styles.quickActionEmoji}>🐑</Text>
              <Text style={styles.quickActionLabel}>Мал бүртгэл</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/health')}>
              <Text style={styles.quickActionEmoji}>🏥</Text>
              <Text style={styles.quickActionLabel}>Эрүүл мэнд</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/breeding')}>
              <Text style={styles.quickActionEmoji}>🐑</Text>
              <Text style={styles.quickActionLabel}>Малын үржил</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Animal Detail Card ──────────────────────────────────────────────────────

function AnimalDetailCard({ animal, router }: { animal: any; router: any }) {
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
          onPress={() => router.push('/(tabs)/livestock')}
        >
          <Text style={styles.editButtonText}>✏️ Засах</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.healthButton}
          onPress={() => router.push('/(tabs)/health')}
        >
          <Text style={styles.healthButtonText}>🏥 Эрүүл мэнд</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.actionButtons, { marginTop: 8, borderTopWidth: 0, paddingTop: 0 }]}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={async () => {
            const info = getAnimalInfo(animal.animal_type);
            const text = `${info.emoji} ${animal.name || info.label}\nЭэмэг: ${animal.ear_tag || '-'}\nЧип: ${animal.chip_id || '-'}\nҮүлдэр: ${animal.breed || '-'}\nНас: ${animal.birth_date ? calcAge(animal.birth_date) : '-'}`;
            await Share.share({ message: text });
          }}
        >
          <Text style={styles.shareButtonText}>📤 Хуваалцах</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={async () => {
            const tag = animal.ear_tag || animal.chip_id || '';
            if (tag) {
              await Clipboard.setStringAsync(tag);
              Alert.alert('Хуулсан', `"${tag}" хуулагдлаа`);
            }
          }}
        >
          <Text style={styles.copyButtonText}>📋 Дугаар хуулах</Text>
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
  shareButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  },
  copyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A1B9A',
  },

  // Mode toggle
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e8ede2',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d0d9c6',
  },
  modeBtnActive: {
    backgroundColor: '#2d5016',
    borderColor: '#2d5016',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.grayDark,
  },
  modeBtnTextActive: {
    color: '#fff',
  },

  // Batch results
  batchSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  batchItemNotFound: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  batchEmoji: { fontSize: 28 },
  batchTag: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  batchInfo: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  batchNotFoundText: { fontSize: 12, color: '#C62828', marginTop: 2 },
  batchStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  batchStatusText: { fontSize: 10, fontWeight: '700' },

  // Quick actions
  quickActions: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontSize: 15, fontWeight: '600', color: '#2d5016' },
});
