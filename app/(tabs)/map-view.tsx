import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { mapApi, pastureApi } from '@/services/api';
import { useLocation } from '@/hooks/use-location';

const subTabs = ['Үйлчилгээ', 'Бэлчээр', 'Зах'];

const serviceTypes = [
  { key: '', label: 'Бүгд', emoji: '📋' },
  { key: 'vet', label: 'Мал эмч', emoji: '🏥' },
  { key: 'feed_store', label: 'Тэжээлийн дэлгүүр', emoji: '🌾' },
  { key: 'transport', label: 'Тээвэр', emoji: '🚚' },
];

const serviceTypeLabel = (type: string) => {
  const found = serviceTypes.find((s) => s.key === type);
  return found ? `${found.emoji} ${found.label}` : type;
};

const qualityColor = (q: string) => {
  if (q === 'маш сайн') return '#1B5E20';
  if (q === 'сайн') return AppColors.success;
  if (q === 'дунд') return AppColors.warning;
  return AppColors.gray;
};

export default function MapViewScreen() {
  const { location, mongoliaLocation, address, loading: locLoading, refresh: refreshLoc, permissionGranted } = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Services state
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [aimags, setAimags] = useState<any[]>([]);
  const [selectedAimag, setSelectedAimag] = useState('');

  // Pastures state
  const [userPastures, setUserPastures] = useState<any[]>([]);
  const [mapPastures, setMapPastures] = useState<any[]>([]);

  // Markets state
  const [markets, setMarkets] = useState<any[]>([]);

  const loadServices = async () => {
    try {
      const [aimagsRes, servicesRes] = await Promise.allSettled([
        mapApi.getAimags(),
        mapApi.getServices(
          selectedServiceType || undefined,
          selectedAimag || undefined
        ),
      ]);
      if (aimagsRes.status === 'fulfilled') setAimags(aimagsRes.value || []);
      if (servicesRes.status === 'fulfilled')
        setServices(servicesRes.value || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPastures = async () => {
    try {
      const [userRes, mapRes] = await Promise.allSettled([
        pastureApi.getAll(),
        mapApi.getPastures(),
      ]);
      if (userRes.status === 'fulfilled')
        setUserPastures(userRes.value || []);
      if (mapRes.status === 'fulfilled') setMapPastures(mapRes.value || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMarkets = async () => {
    try {
      const data = await mapApi.getMarkets();
      setMarkets(data || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    if (activeTab === 0) loadServices();
    else if (activeTab === 1) loadPastures();
    else loadMarkets();
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedServiceType, selectedAimag]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Алдаа', `Утасны дугаар: ${phone}`);
      }
    });
  };

  // ============ TAB 1: Services ============
  const renderServices = () => (
    <>
      {/* Service type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {serviceTypes.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[
              styles.chip,
              selectedServiceType === st.key && styles.chipActive,
            ]}
            onPress={() => setSelectedServiceType(st.key)}
          >
            <Text
              style={[
                styles.chipText,
                selectedServiceType === st.key && styles.chipTextActive,
              ]}
            >
              {st.emoji} {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Aimag filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll2}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.chipSmall, !selectedAimag && styles.chipSmallActive]}
          onPress={() => setSelectedAimag('')}
        >
          <Text
            style={[
              styles.chipSmallText,
              !selectedAimag && styles.chipSmallTextActive,
            ]}
          >
            Бүх аймаг
          </Text>
        </TouchableOpacity>
        {aimags.map((a: any) => (
          <TouchableOpacity
            key={a.name}
            style={[
              styles.chipSmall,
              selectedAimag === a.name && styles.chipSmallActive,
            ]}
            onPress={() => setSelectedAimag(a.name)}
          >
            <Text
              style={[
                styles.chipSmallText,
                selectedAimag === a.name && styles.chipSmallTextActive,
              ]}
            >
              {a.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Service cards */}
      {services.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={styles.emptyTitle}>Үйлчилгээ олдсонгүй</Text>
          <Text style={styles.emptySubtext}>
            Шүүлтүүрээ өөрчилж үзнэ үү
          </Text>
        </View>
      ) : (
        services.map((svc: any, idx: number) => (
          <View key={idx} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceIconWrap}>
                <Text style={{ fontSize: 28 }}>
                  {svc.type === 'vet'
                    ? '🏥'
                    : svc.type === 'feed_store'
                    ? '🌾'
                    : svc.type === 'transport'
                    ? '🚚'
                    : '📍'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceType}>
                  {serviceTypeLabel(svc.type)}
                </Text>
                <View style={styles.serviceDetailRow}>
                  <Text style={styles.serviceAimag}>📍 {svc.aimag}</Text>
                </View>
              </View>
            </View>
            {svc.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(svc.phone)}
              >
                <Text style={styles.callBtnText}>
                  📞 {svc.phone} - Утасдах
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </>
  );

  // ============ TAB 2: Pastures ============
  const renderPastures = () => (
    <>
      {/* User's own pastures */}
      {userPastures.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏕️ Миний бэлчээрүүд</Text>
            <Text style={styles.sectionCount}>
              {userPastures.length} бэлчээр
            </Text>
          </View>
          {userPastures.map((p: any) => (
            <View key={p.id} style={styles.pastureCard}>
              <View style={styles.pastureHeader}>
                <Text style={{ fontSize: 24 }}>🌿</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.pastureName}>{p.name}</Text>
                  <Text style={styles.pastureType}>
                    {p.type === 'winter'
                      ? '❄️ Өвөлжөө'
                      : p.type === 'spring'
                      ? '🌸 Хаваржаа'
                      : p.type === 'summer'
                      ? '☀️ Зуслан'
                      : p.type === 'autumn'
                      ? '🍂 Намаржаа'
                      : '📍 ' + (p.type || 'Бусад')}
                  </Text>
                </View>
              </View>
              <View style={styles.pastureDetails}>
                {(p.lat || p.lng) && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Байршил:</Text>
                    <Text style={styles.detailValue}>
                      {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
                    </Text>
                  </View>
                )}
                {p.area && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📐 Талбай:</Text>
                    <Text style={styles.detailValue}>{p.area} га</Text>
                  </View>
                )}
                {p.grass_quality && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🌱 Өвсний чанар:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: qualityColor(p.grass_quality) },
                      ]}
                    >
                      {p.grass_quality}
                    </Text>
                  </View>
                )}
                {p.water_source && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💧 Усны эх үүсвэр:</Text>
                    <Text style={styles.detailValue}>{p.water_source}</Text>
                  </View>
                )}
                {p.capacity && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🐑 Багтаамж:</Text>
                    <Text style={styles.detailValue}>
                      {p.capacity} толгой
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Map pastures (sample data) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🗺️ Бэлчээрийн мэдээлэл</Text>
        <Text style={styles.sectionCount}>
          {mapPastures.length} бэлчээр
        </Text>
      </View>
      {mapPastures.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>🌾</Text>
          <Text style={styles.emptyTitle}>Бэлчээрийн мэдээлэл байхгүй</Text>
        </View>
      ) : (
        mapPastures.map((p: any, idx: number) => (
          <View key={idx} style={styles.pastureCard}>
            <View style={styles.pastureHeader}>
              <Text style={{ fontSize: 24 }}>
                {p.quality === 'маш сайн'
                  ? '🌳'
                  : p.quality === 'сайн'
                  ? '🌿'
                  : '🏜️'}
              </Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.pastureName}>{p.name}</Text>
                <View style={styles.qualityBadge}>
                  <Text
                    style={[
                      styles.qualityText,
                      { color: qualityColor(p.quality) },
                    ]}
                  >
                    Чанар: {p.quality}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.waterBadge,
                  { backgroundColor: p.water ? '#E3F2FD' : '#FFF3E0' },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{p.water ? '💧' : '🏜️'}</Text>
                <Text
                  style={[
                    styles.waterText,
                    { color: p.water ? '#1565C0' : '#E65100' },
                  ]}
                >
                  {p.water ? 'Устай' : 'Усгүй'}
                </Text>
              </View>
            </View>
            <View style={styles.pastureDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Байршил:</Text>
                <Text style={styles.detailValue}>
                  {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  // ============ TAB 3: Markets ============
  const renderMarkets = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏪 Захууд</Text>
        <Text style={styles.sectionCount}>{markets.length} зах</Text>
      </View>
      {markets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>🏪</Text>
          <Text style={styles.emptyTitle}>Захын мэдээлэл байхгүй</Text>
        </View>
      ) : (
        markets.map((m: any, idx: number) => (
          <View key={idx} style={styles.marketCard}>
            <View style={styles.marketHeader}>
              <View style={styles.marketIconWrap}>
                <Text style={{ fontSize: 28 }}>🏪</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.marketName}>{m.name}</Text>
                <Text style={styles.marketLocation}>
                  📍 {m.lat?.toFixed(4)}, {m.lng?.toFixed(4)}
                </Text>
              </View>
            </View>
            {m.products && m.products.length > 0 && (
              <View style={styles.productsRow}>
                <Text style={styles.productsLabel}>Бүтээгдэхүүн:</Text>
                <View style={styles.productsWrap}>
                  {m.products.map((product: string, pi: number) => (
                    <View key={pi} style={styles.productChip}>
                      <Text style={styles.productChipText}>{product}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Байршил & Үйлчилгээ</Text>
      </View>

      {/* GPS байршил */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationIcon}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Миний байршил</Text>
            {locLoading ? (
              <ActivityIndicator size="small" color="#2d5016" />
            ) : address ? (
              <>
                <Text style={styles.locationAddress}>{address}</Text>
                {location && (
                  <Text style={styles.locationCoords}>
                    {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.locationError}>
                {permissionGranted ? 'Байршил тодорхойлж чадсангүй' : 'Байршлын зөвшөөрөл шаардлагатай'}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={refreshLoc} style={styles.locationRefreshBtn}>
            <Text style={{ fontSize: 18 }}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={styles.tabBar}>
        {subTabs.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text
              style={[styles.tabText, activeTab === i && styles.tabTextActive]}
            >
              {i === 0 ? '🛠️' : i === 1 ? '🌿' : '🏪'} {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={AppColors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {activeTab === 0 && renderServices()}
            {activeTab === 1 && renderPastures()}
            {activeTab === 2 && renderMarkets()}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#2d5016' },
  locationCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#e8f5e9', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#c8e6c9' },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationIcon: { fontSize: 28 },
  locationLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  locationAddress: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  locationCoords: { fontSize: 11, color: '#888', marginTop: 2 },
  locationError: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  locationRefreshBtn: { padding: 8, borderRadius: 20, backgroundColor: '#fff' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#e8ede2',
    borderRadius: 12,
    padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: {
    backgroundColor: AppColors.white,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.1)',
    elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark },
  tabTextActive: { color: '#2d5016', fontWeight: '700' },

  // Filters
  filterScroll: { marginTop: 12 },
  filterScroll2: { marginTop: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1.5,
    borderColor: AppColors.grayMedium },
  chipActive: { backgroundColor: '#2d5016', borderColor: '#2d5016' },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  chipTextActive: { color: AppColors.white },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.grayMedium },
  chipSmallActive: { backgroundColor: '#4a7a32', borderColor: '#4a7a32' },
  chipSmallText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  chipSmallTextActive: { color: AppColors.white },

  // Service card
  serviceCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 3 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center' },
  serviceIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#f0f7ec',
    alignItems: 'center',
    justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  serviceType: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  serviceDetailRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  serviceAimag: { fontSize: 12, color: AppColors.gray },
  callBtn: {
    marginTop: 10,
    backgroundColor: '#e8f5e9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9' },
  callBtnText: { fontSize: 14, fontWeight: '700', color: '#2d5016' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2d5016' },
  sectionCount: { fontSize: 12, color: AppColors.gray },

  // Pasture card
  pastureCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 3 },
  pastureHeader: { flexDirection: 'row', alignItems: 'center' },
  pastureName: { fontSize: 15, fontWeight: '700', color: AppColors.black },
  pastureType: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  qualityBadge: { marginTop: 3 },
  qualityText: { fontSize: 12, fontWeight: '700' },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4 },
  waterText: { fontSize: 11, fontWeight: '700' },
  pastureDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6 },
  detailLabel: { fontSize: 12, color: AppColors.gray },
  detailValue: { fontSize: 12, fontWeight: '600', color: AppColors.black },

  // Market card
  marketCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    elevation: 3 },
  marketHeader: { flexDirection: 'row', alignItems: 'center' },
  marketIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center' },
  marketName: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  marketLocation: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
  productsRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0' },
  productsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.grayDark,
    marginBottom: 6 },
  productsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  productChip: {
    backgroundColor: '#f5f7f0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dde5d5' },
  productChipText: { fontSize: 12, fontWeight: '600', color: '#2d5016' },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 50,
    marginHorizontal: 16,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    marginTop: 16 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.grayDark,
    marginTop: 8 },
  emptySubtext: { fontSize: 13, color: AppColors.gray, marginTop: 4 } });
