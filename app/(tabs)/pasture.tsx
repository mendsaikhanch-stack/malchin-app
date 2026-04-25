import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { pastureApi } from '@/services/api';
import { AdBanner } from '@/components/ad-banner';
import { useLocation } from '@/hooks/use-location';

const tabs = ['Бэлчээр', 'Бэлчээрлэлт', 'Нүүдэл'];

const pastureTypes = [
  { key: 'summer', label: 'Зуслан', emoji: '\�\�' },
  { key: 'winter', label: 'Өвөлжөө', emoji: '\❄\️' },
  { key: 'spring', label: 'Хаваржаа', emoji: '\�\�' },
  { key: 'autumn', label: 'Намаржаа', emoji: '\�\�' },
  { key: 'reserve', label: 'Нөөц', emoji: '\�\�' },
];

const grassQualityMap: Record<string, { label: string; color: string }> = {
  good: { label: 'Сайн', color: '#43A047' },
  fair: { label: 'Дунд', color: '#FF8F00' },
  poor: { label: 'Муу', color: '#E53935' } };

const reasonLabels: Record<string, string> = {
  seasonal: 'Улирлын',
  feed_search: 'Тэжээл хайх',
  water: 'Ус',
  emergency: 'Яаралтай',
  other: 'Бусад' };

const transportLabels: Record<string, string> = {
  on_foot: 'Явган',
  vehicle: 'Машинаар',
  mixed: 'Холимог' };

function fmt(n: number) { return (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(from: string, to?: string) {
  const a = new Date(from);
  const b = to ? new Date(to) : new Date();
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

export default function PastureScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // === Бэлчээр state ===
  const [pastures, setPastures] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active_grazing: 0 });
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAddPasture, setShowAddPasture] = useState(false);
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState('summer');
  const [pLat, setPLat] = useState('');
  const [pLng, setPLng] = useState('');
  const [pArea, setPArea] = useState('');
  const [pCapacity, setPCapacity] = useState('');
  const [pGrass, setPGrass] = useState('good');
  const [pWater, setPWater] = useState('');
  const [pAimag, setPAimag] = useState('');
  const [pSum, setPSum] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [editingPasture, setEditingPasture] = useState<any>(null);

  // === Бэлчээрлэлт state ===
  const [currentGrazing, setCurrentGrazing] = useState<any[]>([]);
  const [pastGrazing, setPastGrazing] = useState<any[]>([]);
  const [showAddGrazing, setShowAddGrazing] = useState(false);
  const [gPastureId, setGPastureId] = useState<number | null>(null);
  const [gStartDate, setGStartDate] = useState(todayStr());
  const [gAnimalCount, setGAnimalCount] = useState('');
  const [gGrassStart, setGGrassStart] = useState('good');
  const [gNotes, setGNotes] = useState('');
  const [showEndGrazing, setShowEndGrazing] = useState(false);
  const [endingGrazingId, setEndingGrazingId] = useState<number | null>(null);
  const [gEndDate, setGEndDate] = useState(todayStr());
  const [gGrassEnd, setGGrassEnd] = useState('fair');

  // === Нүүдэл state ===
  const [migrations, setMigrations] = useState<any[]>([]);
  const [migStats, setMigStats] = useState<any>({ total: 0, total_distance: 0 });
  const [migYear, setMigYear] = useState<number>(new Date().getFullYear());
  const [showAddMigration, setShowAddMigration] = useState(false);
  const [mFromPasture, setMFromPasture] = useState<number | null>(null);
  const [mToPasture, setMToPasture] = useState<number | null>(null);
  const [mFromLocation, setMFromLocation] = useState('');
  const [mToLocation, setMToLocation] = useState('');
  const [mDate, setMDate] = useState(todayStr());
  const [mAnimalCount, setMAnimalCount] = useState('');
  const [mDistance, setMDistance] = useState('');
  const [mDuration, setMDuration] = useState('');
  const [mReason, setMReason] = useState('seasonal');
  const [mTransport, setMTransport] = useState('on_foot');
  const [mCost, setMCost] = useState('');
  const [mNotes, setMNotes] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      if (activeTab === 0) {
        const [pRes, sRes] = await Promise.allSettled([
          pastureApi.getAll(typeFilter || undefined),
          pastureApi.getStats(),
        ]);
        if (pRes.status === 'fulfilled') setPastures(pRes.value || []);
        if (sRes.status === 'fulfilled') setStats(sRes.value || { total: 0, active_grazing: 0 });
      } else if (activeTab === 1) {
        const [curRes, allRes] = await Promise.allSettled([
          pastureApi.getCurrentGrazing(),
          pastureApi.getGrazing(),
        ]);
        if (curRes.status === 'fulfilled') setCurrentGrazing(curRes.value || []);
        if (allRes.status === 'fulfilled') {
          const all = allRes.value || [];
          setPastGrazing(all.filter((g: any) => g.end_date));
        }
      } else {
        const mRes = await pastureApi.getMigrations(migYear);
        const mData = mRes || [];
        setMigrations(mData);
        const totalDist = mData.reduce((sum: number, m: any) => sum + (m.distance_km || 0), 0);
        setMigStats({ total: mData.length, total_distance: totalDist });
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, typeFilter, migYear]);

  useEffect(() => { loadData(); }, [loadData]);

  // ===== Бэлчээр handlers =====
  const resetPastureForm = () => {
    setPName(''); setPType('summer'); setPLat(''); setPLng('');
    setPArea(''); setPCapacity(''); setPGrass('good'); setPWater('');
    setPAimag(''); setPSum(''); setPNotes(''); setEditingPasture(null);
  };

  const openEditPasture = (p: any) => {
    setEditingPasture(p);
    setPName(p.name || '');
    setPType(p.type || 'summer');
    setPLat(p.lat ? String(p.lat) : '');
    setPLng(p.lng ? String(p.lng) : '');
    setPArea(p.area ? String(p.area) : '');
    setPCapacity(p.capacity ? String(p.capacity) : '');
    setPGrass(p.grass_quality || 'good');
    setPWater(p.water_source || '');
    setPAimag(p.aimag || '');
    setPSum(p.sum || '');
    setPNotes(p.notes || '');
    setShowAddPasture(true);
  };

  const handleSavePasture = async () => {
    if (!pName.trim()) { Alert.alert('Алдаа', 'Бэлчээрийн нэр оруулна уу'); return; }
    const data: any = {
      name: pName.trim(), type: pType,
      area: parseFloat(pArea) || undefined,
      capacity: parseInt(pCapacity) || undefined,
      grass_quality: pGrass,
      water_source: pWater.trim() || undefined,
      aimag: pAimag.trim() || undefined,
      sum: pSum.trim() || undefined,
      notes: pNotes.trim() || undefined };
    if (pLat.trim()) data.lat = parseFloat(pLat);
    if (pLng.trim()) data.lng = parseFloat(pLng);
    try {
      if (editingPasture) {
        await pastureApi.update(editingPasture.id, data);
      } else {
        await pastureApi.create(data);
      }
      setShowAddPasture(false); resetPastureForm(); loadData();
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  const handleDeletePasture = (id: number) => {
    Alert.alert('Устгах', 'Энэ бэлчээрийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await pastureApi.delete(id); loadData(); } catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ===== Бэлчээрлэлт handlers =====
  const handleStartGrazing = async () => {
    if (!gPastureId) { Alert.alert('Алдаа', 'Бэлчээр сонгоно уу'); return; }
    if (!gStartDate.trim()) { Alert.alert('Алдаа', 'Эхлэх огноо оруулна уу'); return; }
    try {
      await pastureApi.startGrazing({
        pasture_id: gPastureId,
        start_date: gStartDate,
        animal_count: parseInt(gAnimalCount) || undefined,
        grass_condition_start: gGrassStart,
        notes: gNotes.trim() || undefined });
      setShowAddGrazing(false);
      setGPastureId(null); setGStartDate(todayStr()); setGAnimalCount(''); setGGrassStart('good'); setGNotes('');
      loadData();
    } catch { Alert.alert('Алдаа', 'Бэлчээрлэлт эхлүүлэхэд алдаа гарлаа'); }
  };

  const openEndGrazing = (id: number) => {
    setEndingGrazingId(id);
    setGEndDate(todayStr());
    setGGrassEnd('fair');
    setShowEndGrazing(true);
  };

  const handleEndGrazing = async () => {
    if (!endingGrazingId) return;
    try {
      await pastureApi.endGrazing(endingGrazingId, { end_date: gEndDate, grass_condition_end: gGrassEnd });
      setShowEndGrazing(false); setEndingGrazingId(null);
      loadData();
    } catch { Alert.alert('Алдаа', 'Дуусгахад алдаа гарлаа'); }
  };

  const handleDeleteGrazing = (id: number) => {
    Alert.alert('Устгах', 'Энэ бэлчээрлэлтийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await pastureApi.deleteGrazing(id); loadData(); } catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ===== Нүүдэл handlers =====
  const handleSaveMigration = async () => {
    if (!mDate.trim()) { Alert.alert('Алдаа', 'Нүүдлийн огноо оруулна уу'); return; }
    if (!mFromPasture && !mFromLocation.trim()) { Alert.alert('Алдаа', 'Хаанаас гарсан мэдээлэл оруулна уу'); return; }
    if (!mToPasture && !mToLocation.trim()) { Alert.alert('Алдаа', 'Хаашаа нүүсэн мэдээлэл оруулна уу'); return; }
    try {
      await pastureApi.createMigration({
        migration_date: mDate,
        from_pasture_id: mFromPasture || undefined,
        to_pasture_id: mToPasture || undefined,
        from_location: mFromLocation.trim() || undefined,
        to_location: mToLocation.trim() || undefined,
        animal_count: parseInt(mAnimalCount) || undefined,
        distance_km: parseFloat(mDistance) || undefined,
        duration_hours: parseFloat(mDuration) || undefined,
        reason: mReason,
        transport_method: mTransport,
        cost: parseFloat(mCost) || undefined,
        notes: mNotes.trim() || undefined });
      setShowAddMigration(false);
      setMFromPasture(null); setMToPasture(null); setMFromLocation(''); setMToLocation('');
      setMDate(todayStr()); setMAnimalCount(''); setMDistance(''); setMDuration('');
      setMReason('seasonal'); setMTransport('on_foot'); setMCost(''); setMNotes('');
      loadData();
    } catch { Alert.alert('Алдаа', 'Нүүдэл нэмэхэд алдаа гарлаа'); }
  };

  const handleDeleteMigration = (id: number) => {
    Alert.alert('Устгах', 'Энэ нүүдлийг устгах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try { await pastureApi.deleteMigration(id); loadData(); } catch { Alert.alert('Алдаа', 'Устгахад алдаа гарлаа'); }
      }},
    ]);
  };

  // ===== Бэлчээр дүрслэл =====
  const getTypeInfo = (type: string) => pastureTypes.find(t => t.key === type) || { key: type, label: type, emoji: '\�\�' };

  const getPastureName = (id: number | null | undefined) => {
    if (!id) return '';
    const p = pastures.find((p: any) => p.id === id);
    return p ? p.name : `#${id}`;
  };

  const renderPastures = () => (
    <>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statValue}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Нийт бэлчээр</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statValue, { color: AppColors.secondary }]}>{stats.active_grazing || 0}</Text>
          <Text style={styles.statLabel}>Идэвхтэй бэлчээрлэлт</Text>
        </View>
      </View>

      {/* Filter by type */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
          <TouchableOpacity
            style={[styles.filterChip, !typeFilter && styles.filterChipActive]}
            onPress={() => setTypeFilter('')}
          >
            <Text style={[styles.filterChipText, !typeFilter && styles.filterChipTextActive]}>Бүгд</Text>
          </TouchableOpacity>
          {pastureTypes.map(pt => (
            <TouchableOpacity
              key={pt.key}
              style={[styles.filterChip, typeFilter === pt.key && styles.filterChipActive]}
              onPress={() => setTypeFilter(typeFilter === pt.key ? '' : pt.key)}
            >
              <Text style={[styles.filterChipText, typeFilter === pt.key && styles.filterChipTextActive]}>
                {pt.emoji} {pt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => { resetPastureForm(); setShowAddPasture(true); }}>
        <Text style={styles.addBtnText}>+ Бэлчээр</Text>
      </TouchableOpacity>

      {/* Pasture list */}
      {pastures.length > 0 ? pastures.map((p: any) => {
        const typeInfo = getTypeInfo(p.type);
        const quality = grassQualityMap[p.grass_quality] || grassQualityMap.good;
        return (
          <TouchableOpacity key={p.id} style={styles.card} onLongPress={() => handleDeletePasture(p.id)} onPress={() => openEditPasture(p)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.typeBadgeText}>{typeInfo.emoji} {typeInfo.label}</Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              {p.area != null && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Талбай</Text>
                  <Text style={styles.cardInfoValue}>{fmt(p.area)} га</Text>
                </View>
              )}
              {p.capacity != null && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Багтаамж</Text>
                  <Text style={styles.cardInfoValue}>{fmt(p.capacity)} мал</Text>
                </View>
              )}
              <View style={styles.cardInfoItem}>
                <Text style={styles.cardInfoLabel}>Ногоо</Text>
                <View style={[styles.qualityBadge, { backgroundColor: quality.color + '20' }]}>
                  <Text style={[styles.qualityBadgeText, { color: quality.color }]}>{quality.label}</Text>
                </View>
              </View>
            </View>

            {(p.water_source || p.aimag || p.sum) && (
              <View style={styles.cardMeta}>
                {p.water_source ? <Text style={styles.cardMetaText}>{'\�\�'} {p.water_source}</Text> : null}
                {(p.aimag || p.sum) ? (
                  <Text style={styles.cardMetaText}>{'\�\�'} {[p.aimag, p.sum].filter(Boolean).join(', ')}</Text>
                ) : null}
              </View>
            )}

            {p.active_grazing && (
              <View style={styles.activeIndicator}>
                <Text style={styles.activeIndicatorText}>{'\�\�'} Одоо бэлчээрлэж байна</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }) : <Text style={styles.emptyText}>Бэлчээр бүртгэгдээгүй байна</Text>}
    </>
  );

  // ===== Бэлчээрлэлт дүрслэл =====
  const renderGrazing = () => (
    <>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddGrazing(true)}>
        <Text style={styles.addBtnText}>+ Эхлүүлэх</Text>
      </TouchableOpacity>

      {/* Current active grazings */}
      {currentGrazing.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{'\�\�'} Идэвхтэй бэлчээрлэлт</Text>
          {currentGrazing.map((g: any) => {
            const days = daysBetween(g.start_date);
            const quality = grassQualityMap[g.grass_condition_start] || grassQualityMap.good;
            return (
              <View key={g.id} style={[styles.card, styles.activeCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{g.pasture_name || getPastureName(g.pasture_id)}</Text>
                  <View style={[styles.daysBadge]}>
                    <Text style={styles.daysBadgeText}>{days} хоног</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  {g.animal_count != null && (
                    <View style={styles.cardInfoItem}>
                      <Text style={styles.cardInfoLabel}>Мал</Text>
                      <Text style={styles.cardInfoValue}>{fmt(g.animal_count)}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfoItem}>
                    <Text style={styles.cardInfoLabel}>Эхэлсэн</Text>
                    <Text style={styles.cardInfoValue}>{g.start_date}</Text>
                  </View>
                  <View style={styles.cardInfoItem}>
                    <Text style={styles.cardInfoLabel}>Ногоо</Text>
                    <View style={[styles.qualityBadge, { backgroundColor: quality.color + '20' }]}>
                      <Text style={[styles.qualityBadgeText, { color: quality.color }]}>{quality.label}</Text>
                    </View>
                  </View>
                </View>
                {g.notes ? <Text style={styles.notesText}>{g.notes}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.endBtn} onPress={() => openEndGrazing(g.id)}>
                    <Text style={styles.endBtnText}>Дуусгах</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteSmBtn} onPress={() => handleDeleteGrazing(g.id)}>
                    <Text style={styles.deleteSmBtnText}>Устгах</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Past grazings */}
      {pastGrazing.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{'\�\�'} Түүх</Text>
          {pastGrazing.map((g: any) => {
            const days = daysBetween(g.start_date, g.end_date);
            const qualityStart = grassQualityMap[g.grass_condition_start] || grassQualityMap.good;
            const qualityEnd = grassQualityMap[g.grass_condition_end] || grassQualityMap.fair;
            return (
              <TouchableOpacity key={g.id} style={styles.card} onLongPress={() => handleDeleteGrazing(g.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{g.pasture_name || getPastureName(g.pasture_id)}</Text>
                  <Text style={styles.daysText}>{days} хоног</Text>
                </View>
                <View style={styles.cardRow}>
                  {g.animal_count != null && (
                    <View style={styles.cardInfoItem}>
                      <Text style={styles.cardInfoLabel}>Мал</Text>
                      <Text style={styles.cardInfoValue}>{fmt(g.animal_count)}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfoItem}>
                    <Text style={styles.cardInfoLabel}>Хугацаа</Text>
                    <Text style={styles.cardInfoValue}>{g.start_date} - {g.end_date}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={[styles.qualityBadge, { backgroundColor: qualityStart.color + '20' }]}>
                    <Text style={[styles.qualityBadgeText, { color: qualityStart.color }]}>Эхэнд: {qualityStart.label}</Text>
                  </View>
                  <Text style={{ color: AppColors.gray }}>{'\→'}</Text>
                  <View style={[styles.qualityBadge, { backgroundColor: qualityEnd.color + '20' }]}>
                    <Text style={[styles.qualityBadgeText, { color: qualityEnd.color }]}>Төгсгөл: {qualityEnd.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {currentGrazing.length === 0 && pastGrazing.length === 0 && (
        <Text style={styles.emptyText}>Бэлчээрлэлтийн бүртгэл байхгүй</Text>
      )}
    </>
  );

  // ===== Нүүдэл дүрслэл =====
  const renderMigrations = () => (
    <>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statValue, { color: '#1565C0' }]}>{migStats.total}</Text>
          <Text style={styles.statLabel}>Нийт нүүдэл</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statValue, { color: AppColors.secondary }]}>{fmt(Math.round(migStats.total_distance))}</Text>
          <Text style={styles.statLabel}>Нийт зай (км)</Text>
        </View>
      </View>

      {/* Year filter */}
      <View style={styles.yearFilter}>
        <TouchableOpacity style={styles.yearBtn} onPress={() => setMigYear(y => y - 1)}>
          <Text style={styles.yearBtnText}>{'\◀'}</Text>
        </TouchableOpacity>
        <Text style={styles.yearText}>{migYear} он</Text>
        <TouchableOpacity style={styles.yearBtn} onPress={() => setMigYear(y => y + 1)}>
          <Text style={styles.yearBtnText}>{'\▶'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMigration(true)}>
        <Text style={styles.addBtnText}>+ Нүүдэл</Text>
      </TouchableOpacity>

      {/* Migration list */}
      {migrations.length > 0 ? migrations.map((m: any) => {
        const fromName = m.from_pasture_name || m.from_location || getPastureName(m.from_pasture_id) || '?';
        const toName = m.to_pasture_name || m.to_location || getPastureName(m.to_pasture_id) || '?';
        const reasonText = reasonLabels[m.reason] || m.reason || '';
        const transportText = transportLabels[m.transport_method] || m.transport_method || '';
        return (
          <TouchableOpacity key={m.id} style={styles.card} onLongPress={() => handleDeleteMigration(m.id)}>
            <View style={styles.migRoute}>
              <Text style={styles.migFrom}>{fromName}</Text>
              <Text style={styles.migArrow}>{'\→'}</Text>
              <Text style={styles.migTo}>{toName}</Text>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.cardInfoItem}>
                <Text style={styles.cardInfoLabel}>Огноо</Text>
                <Text style={styles.cardInfoValue}>{m.migration_date}</Text>
              </View>
              {m.animal_count != null && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Мал</Text>
                  <Text style={styles.cardInfoValue}>{fmt(m.animal_count)}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardRow}>
              {m.distance_km != null && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Зай</Text>
                  <Text style={styles.cardInfoValue}>{m.distance_km} км</Text>
                </View>
              )}
              {m.duration_hours != null && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Хугацаа</Text>
                  <Text style={styles.cardInfoValue}>{m.duration_hours} цаг</Text>
                </View>
              )}
              {m.cost != null && m.cost > 0 && (
                <View style={styles.cardInfoItem}>
                  <Text style={styles.cardInfoLabel}>Зардал</Text>
                  <Text style={styles.cardInfoValue}>{'\₮'}{fmt(m.cost)}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {reasonText ? (
                <View style={[styles.reasonBadge]}>
                  <Text style={styles.reasonBadgeText}>{reasonText}</Text>
                </View>
              ) : null}
              {transportText ? (
                <View style={[styles.transportBadge]}>
                  <Text style={styles.transportBadgeText}>{transportText}</Text>
                </View>
              ) : null}
            </View>

            {m.notes ? <Text style={styles.notesText}>{m.notes}</Text> : null}
          </TouchableOpacity>
        );
      }) : <Text style={styles.emptyText}>Нүүдлийн бүртгэл байхгүй</Text>}
    </>
  );

  // ===== Pasture picker (for grazing / migration modals) =====
  const renderPasturePicker = (selectedId: number | null, onSelect: (id: number | null) => void, label: string) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {pastures.length > 0 ? pastures.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.typeChip, selectedId === p.id && styles.typeChipActive]}
              onPress={() => onSelect(selectedId === p.id ? null : p.id)}
            >
              <Text style={styles.typeChipText}>{getTypeInfo(p.type).emoji} {p.name}</Text>
            </TouchableOpacity>
          )) : (
            <Text style={{ color: AppColors.gray, fontSize: 12, paddingVertical: 8 }}>Бэлчээр бүртгэнэ үү</Text>
          )}
        </View>
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\�\�'} Бэлчээр</Text>
      </View>

      {/* Sub-tabs */}
      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#2d5016" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 30 }} />
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {activeTab === 0 && renderPastures()}
            {activeTab === 1 && renderGrazing()}
            {activeTab === 2 && renderMigrations()}
          </View>
        )}
        <AdBanner placement="pasture" />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== Бэлчээр нэмэх/засах Modal ===== */}
      <Modal visible={showAddPasture} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingPasture ? 'Бэлчээр засах' : 'Бэлчээр нэмэх'}</Text>

              <Text style={styles.label}>Нэр</Text>
              <TextInput style={styles.input} value={pName} onChangeText={setPName} placeholder="Жнь: Зуны бэлчээр" placeholderTextColor={AppColors.gray} />

              <Text style={styles.label}>Төрөл</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {pastureTypes.map(pt => (
                    <TouchableOpacity key={pt.key} style={[styles.typeChip, pType === pt.key && styles.typeChipActive]} onPress={() => setPType(pt.key)}>
                      <Text style={styles.typeChipText}>{pt.emoji} {pt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Өргөрөг (lat)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={pLat} onChangeText={setPLat} placeholder="47.9138" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Уртраг (lng)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={pLng} onChangeText={setPLng} placeholder="106.9057" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Талбай (га)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={pArea} onChangeText={setPArea} placeholder="100" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Багтаамж (мал)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={pCapacity} onChangeText={setPCapacity} placeholder="500" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Ногооны чанар</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['good', 'fair', 'poor'] as const).map(q => {
                  const info = grassQualityMap[q];
                  return (
                    <TouchableOpacity key={q} style={[styles.typeChip, pGrass === q && { borderColor: info.color, backgroundColor: info.color + '20' }]} onPress={() => setPGrass(q)}>
                      <Text style={[styles.typeChipText, pGrass === q && { color: info.color }]}>{info.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Усны эх үүсвэр</Text>
              <TextInput style={styles.input} value={pWater} onChangeText={setPWater} placeholder="Жнь: Гол, булаг" placeholderTextColor={AppColors.gray} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Аймаг</Text>
                  <TextInput style={styles.input} value={pAimag} onChangeText={setPAimag} placeholder="Төв" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Сум</Text>
                  <TextInput style={styles.input} value={pSum} onChangeText={setPSum} placeholder="Баянчандмань" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Тэмдэглэл</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={pNotes} onChangeText={setPNotes} placeholder="Нэмэлт мэдээлэл..." placeholderTextColor={AppColors.gray} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddPasture(false); resetPastureForm(); }}>
                  <Text style={styles.cancelText}>Болих</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePasture}>
                  <Text style={styles.saveText}>Хадгалах</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ===== Бэлчээрлэлт эхлүүлэх Modal ===== */}
      <Modal visible={showAddGrazing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Бэлчээрлэлт эхлүүлэх</Text>

            {renderPasturePicker(gPastureId, setGPastureId, 'Бэлчээр сонгох')}

            <Text style={styles.label}>Эхлэх огноо (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={gStartDate} onChangeText={setGStartDate} placeholder={todayStr()} placeholderTextColor={AppColors.gray} />

            <Text style={styles.label}>Малын тоо</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={gAnimalCount} onChangeText={setGAnimalCount} placeholder="200" placeholderTextColor={AppColors.gray} />

            <Text style={styles.label}>Ногооны байдал (эхэнд)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['good', 'fair', 'poor'] as const).map(q => {
                const info = grassQualityMap[q];
                return (
                  <TouchableOpacity key={q} style={[styles.typeChip, gGrassStart === q && { borderColor: info.color, backgroundColor: info.color + '20' }]} onPress={() => setGGrassStart(q)}>
                    <Text style={[styles.typeChipText, gGrassStart === q && { color: info.color }]}>{info.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Тэмдэглэл</Text>
            <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={gNotes} onChangeText={setGNotes} placeholder="Нэмэлт мэдээлэл..." placeholderTextColor={AppColors.gray} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddGrazing(false)}>
                <Text style={styles.cancelText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleStartGrazing}>
                <Text style={styles.saveText}>Эхлүүлэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Бэлчээрлэлт дуусгах Modal ===== */}
      <Modal visible={showEndGrazing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Бэлчээрлэлт дуусгах</Text>

            <Text style={styles.label}>Дуусах огноо (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={gEndDate} onChangeText={setGEndDate} placeholder={todayStr()} placeholderTextColor={AppColors.gray} />

            <Text style={styles.label}>Ногооны байдал (төгсгөлд)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['good', 'fair', 'poor'] as const).map(q => {
                const info = grassQualityMap[q];
                return (
                  <TouchableOpacity key={q} style={[styles.typeChip, gGrassEnd === q && { borderColor: info.color, backgroundColor: info.color + '20' }]} onPress={() => setGGrassEnd(q)}>
                    <Text style={[styles.typeChipText, gGrassEnd === q && { color: info.color }]}>{info.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEndGrazing(false)}>
                <Text style={styles.cancelText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEndGrazing}>
                <Text style={styles.saveText}>Дуусгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Нүүдэл нэмэх Modal ===== */}
      <Modal visible={showAddMigration} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Нүүдэл бүртгэх</Text>

              {renderPasturePicker(mFromPasture, setMFromPasture, 'Хаанаас (бэлчээр)')}
              <Text style={styles.label}>Эсвэл байршил бичих</Text>
              <TextInput style={styles.input} value={mFromLocation} onChangeText={setMFromLocation} placeholder="Жнь: Хангайн зуслан" placeholderTextColor={AppColors.gray} />

              {renderPasturePicker(mToPasture, setMToPasture, 'Хаашаа (бэлчээр)')}
              <Text style={styles.label}>Эсвэл байршил бичих</Text>
              <TextInput style={styles.input} value={mToLocation} onChangeText={setMToLocation} placeholder="Жнь: Хэрлэн өвөлжөө" placeholderTextColor={AppColors.gray} />

              <Text style={styles.label}>Нүүдлийн огноо (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={mDate} onChangeText={setMDate} placeholder={todayStr()} placeholderTextColor={AppColors.gray} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Малын тоо</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={mAnimalCount} onChangeText={setMAnimalCount} placeholder="300" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Зай (км)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={mDistance} onChangeText={setMDistance} placeholder="50" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Хугацаа (цаг)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={mDuration} onChangeText={setMDuration} placeholder="8" placeholderTextColor={AppColors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Зардал</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={mCost} onChangeText={setMCost} placeholder="50000" placeholderTextColor={AppColors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Шалтгаан</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {Object.entries(reasonLabels).map(([key, label]) => (
                    <TouchableOpacity key={key} style={[styles.typeChip, mReason === key && styles.typeChipActive]} onPress={() => setMReason(key)}>
                      <Text style={[styles.typeChipText, mReason === key && styles.typeChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Тээврийн хэлбэр</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Object.entries(transportLabels).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.typeChip, mTransport === key && styles.typeChipActive]} onPress={() => setMTransport(key)}>
                    <Text style={[styles.typeChipText, mTransport === key && styles.typeChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Тэмдэглэл</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={mNotes} onChangeText={setMNotes} placeholder="Нэмэлт мэдээлэл..." placeholderTextColor={AppColors.gray} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddMigration(false)}>
                  <Text style={styles.cancelText}>Болих</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMigration}>
                  <Text style={styles.saveText}>Хадгалах</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },

  // Sub-tabs
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#e8ece2', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#616161' },
  tabTextActive: { color: '#2d5016', fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2d5016' },
  statLabel: { fontSize: 10, color: '#616161', marginTop: 2, textAlign: 'center' },

  // Filter chips
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  filterChipActive: { borderColor: '#2d5016', backgroundColor: '#e8f0e0' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#616161' },
  filterChipTextActive: { color: '#2d5016' },

  // Cards
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginTop: 10, elevation: 2, boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' },
  activeCard: { borderWidth: 2, borderColor: '#4a7c28', backgroundColor: '#f9fcf5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  cardRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cardInfoItem: { flex: 1 },
  cardInfoLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  cardInfoValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 1 },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cardMetaText: { fontSize: 11, color: '#616161' },

  // Type badge
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#2d5016' },

  // Quality badge
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  qualityBadgeText: { fontSize: 11, fontWeight: '700' },

  // Active indicator
  activeIndicator: { marginTop: 8, paddingVertical: 4 },
  activeIndicatorText: { fontSize: 11, color: '#43A047', fontWeight: '600' },

  // Grazing days
  daysBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  daysBadgeText: { fontSize: 12, fontWeight: '700', color: '#2d5016' },
  daysText: { fontSize: 12, fontWeight: '600', color: '#9E9E9E' },

  // Migration route
  migRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  migFrom: { fontSize: 14, fontWeight: '700', color: '#2d5016', flex: 1 },
  migArrow: { fontSize: 18, color: '#9E9E9E' },
  migTo: { fontSize: 14, fontWeight: '700', color: '#4a7c28', flex: 1, textAlign: 'right' },

  // Reason / transport badges
  reasonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E3F2FD' },
  reasonBadgeText: { fontSize: 11, fontWeight: '600', color: '#1565C0' },
  transportBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFF3E0' },
  transportBadgeText: { fontSize: 11, fontWeight: '600', color: '#E65100' },

  // Year filter
  yearFilter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  yearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8ece2', justifyContent: 'center', alignItems: 'center' },
  yearBtnText: { fontSize: 14, color: '#2d5016', fontWeight: '700' },
  yearText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  // Buttons
  addBtn: { backgroundColor: '#2d5016', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  endBtn: { flex: 1, backgroundColor: '#FF8F00', padding: 10, borderRadius: 10, alignItems: 'center' },
  endBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  deleteSmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E53935' },
  deleteSmBtnText: { color: '#E53935', fontSize: 13, fontWeight: '600' },

  // Misc
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 20, marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#9E9E9E', marginTop: 24, fontSize: 14 },
  notesText: { fontSize: 12, color: '#616161', marginTop: 6, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#616161', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1A1A1A', backgroundColor: '#FAFAFA' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  typeChipActive: { borderColor: '#2d5016', backgroundColor: '#e8f0e0' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#616161' },
  typeChipTextActive: { color: '#2d5016' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#616161' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2d5016', alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' } });
