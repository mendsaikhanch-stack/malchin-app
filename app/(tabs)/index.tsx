import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { livestockApi, weatherApi, alertsApi, aiApi, financeApi } from '@/services/api';
import { AdBanner, AdBannerLarge } from '@/components/ad-banner';

const animalNames: Record<string, string> = {
  sheep: 'Хонь', goat: 'Ямаа', cattle: 'Үхэр',
  horse: 'Адуу', camel: 'Тэмээ',
};

const conditionMn = (condition: string) => {
  const c = (condition || '').toLowerCase();
  if (c.includes('clear') || c.includes('sunny')) return 'Цэлмэг';
  if (c.includes('cloud')) return 'Үүлэрхэг';
  if (c.includes('rain')) return 'Бороотой';
  if (c.includes('snow')) return 'Цастай';
  if (c.includes('wind')) return 'Салхитай';
  return condition;
};

const dzudMn = (risk: string) => {
  if (risk === 'high') return 'Өндөр';
  if (risk === 'medium') return 'Дунд';
  return 'Бага';
};

const animalEmojis: Record<string, string> = {
  sheep: '🐑', goat: '🐐', cattle: '🐂',
  horse: '🐎', camel: '🐪',
};

const quickActionItems = [
  { emoji: '🐑', label: 'Мал бүртгэл', route: '/livestock' },
  { emoji: '🤰', label: 'Хээлтүүлэг', route: '/breeding' },
  { emoji: '🏥', label: 'Эрүүл мэнд', route: '/health' },
  { emoji: '🌿', label: 'Бэлчээр', route: '/pasture' },
  { emoji: '🏷️', label: 'Ээмэг хайх', route: '/scanner' },
  { emoji: '👨‍👩‍👧‍👦', label: 'Өрх бүл', route: '/household' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tip, setTip] = useState('');
  const [finance, setFinance] = useState<any>(null);

  const userId = 1;

  const loadData = async () => {
    try {
      const [statsRes, weatherRes, alertsRes, tipRes, financeRes] = await Promise.allSettled([
        livestockApi.getStats(userId),
        weatherApi.getByAimag('Төв'),
        alertsApi.getAll(),
        aiApi.getTip(),
        financeApi.getSummary(userId),
      ]);

      if (statsRes.status === 'fulfilled') {
        const items = (statsRes.value.livestock || []).map((item: any) => ({
          ...item,
          emoji: animalEmojis[item.animal_type] || '🐾',
        }));
        setLivestock(items);
        setTotalAnimals(statsRes.value.total_animals || 0);
      }
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);
      if (alertsRes.status === 'fulfilled') setAlerts((alertsRes.value || []).slice(0, 3));
      if (tipRes.status === 'fulfilled') setTip(tipRes.value.tip || '');
      if (financeRes.status === 'fulfilled') setFinance(financeRes.value);
    } catch {
      // show what we can
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const dzudColor = (risk: string) => {
    if (risk === 'high') return AppColors.danger;
    if (risk === 'medium') return AppColors.warning;
    return AppColors.success;
  };

  const severityColor = (s: string) => {
    if (s === 'high') return AppColors.danger;
    if (s === 'medium') return AppColors.warning;
    return AppColors.accent;
  };

  const formatMoney = (amount: number) => {
    if (amount == null) return '0₮';
    return amount.toLocaleString('mn-MN') + '₮';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Сайн байна уу!</Text>
          <Text style={styles.appTitle}>МАЛЧИН</Text>
        </View>

        {/* Малын тоо */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/livestock')}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🐑 Миний мал</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalAnimals} толгой</Text>
            </View>
          </View>
          <View style={styles.livestockGrid}>
            {livestock.length > 0 ? livestock.map((item: any) => (
              <View key={item.animal_type} style={styles.livestockItem}>
                <Text style={styles.livestockEmoji}>{item.emoji}</Text>
                <Text style={styles.livestockCount}>{item.total_count}</Text>
                <Text style={styles.livestockType}>{animalNames[item.animal_type] || item.animal_type}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>Мал бүртгэхийн тулд дарна уу</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Цаг агаар */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/weather')}>
          <Text style={styles.cardTitle}>⛅ Цаг агаар - {weather?.aimag || 'Төв'}</Text>
          {weather ? (
            <View style={styles.weatherRow}>
              <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
              <Text style={styles.weatherCondition}>{conditionMn(weather.condition)}</Text>
              <View style={[styles.dzudBadge, { backgroundColor: dzudColor(weather.dzud_risk) }]}>
                <Text style={styles.dzudText}>Зуд: {dzudMn(weather.dzud_risk)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Цаг агаарын мэдээ ачааллаж чадсангүй</Text>
          )}
        </TouchableOpacity>

        {/* Сурталчилгаа */}
        <AdBanner placement="home" />

        {/* Сэрэмжлүүлэг */}
        {alerts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚨 Сэрэмжлүүлэг</Text>
            {alerts.map((alert: any) => (
              <View key={alert.id} style={[styles.alertItem, { borderLeftColor: severityColor(alert.severity) }]}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertRegion}>{alert.region}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Өдрийн зөвлөгөө */}
        {tip ? (
          <TouchableOpacity style={[styles.card, styles.tipCard]} onPress={() => router.push('/(tabs)/ai-advisor')}>
            <Text style={styles.cardTitle}>💡 Өдрийн зөвлөгөө</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Санхүүгийн тойм */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/finance')}>
          <Text style={styles.cardTitle}>💰 Санхүүгийн тойм</Text>
          {finance ? (
            <View style={styles.financeContainer}>
              <View style={styles.financeRow}>
                <View style={[styles.financeItem, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.financeLabel}>Орлого</Text>
                  <Text style={[styles.financeAmount, { color: AppColors.success }]}>
                    {formatMoney(finance.total_income || 0)}
                  </Text>
                </View>
                <View style={[styles.financeItem, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={styles.financeLabel}>Зарлага</Text>
                  <Text style={[styles.financeAmount, { color: AppColors.danger }]}>
                    {formatMoney(finance.total_expense || 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Цэвэр ашиг</Text>
                <Text style={[
                  styles.profitAmount,
                  { color: (finance.profit || 0) >= 0 ? AppColors.success : AppColors.danger }
                ]}>
                  {(finance.profit || 0) >= 0 ? '+' : ''}{formatMoney(finance.profit || 0)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Санхүүгийн мэдээлэл ачааллаж чадсангүй</Text>
          )}
        </TouchableOpacity>

        {/* Шуурхай үйлдэл - 2x3 grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Шуурхай үйлдэл</Text>
          <View style={styles.quickActionsGrid}>
            {quickActionItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.gridActionBtn}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={styles.gridActionIcon}>{item.emoji}</Text>
                <Text style={styles.gridActionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick actions - existing 4 buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => router.push('/(tabs)/diagnose')}>
            <Text style={styles.actionIcon}>🩺</Text>
            <Text style={styles.actionLabel}>Оношлогч</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/market')}>
            <Text style={styles.actionIcon}>🏪</Text>
            <Text style={styles.actionLabel}>Зах зээл</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/weather')}>
            <Text style={styles.actionIcon}>🌡️</Text>
            <Text style={styles.actionLabel}>Цаг агаар</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/ai-advisor')}>
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionLabel}>Зөвлөгч</Text>
          </TouchableOpacity>
        </View>

        {/* Том сурталчилгаа */}
        <AdBannerLarge placement="home" />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 16, color: AppColors.grayDark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 16, color: AppColors.grayDark },
  appTitle: { fontSize: 28, fontWeight: '800', color: AppColors.primary, marginTop: 4 },
  card: {
    backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black, marginBottom: 12 },
  totalBadge: {
    backgroundColor: AppColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  totalBadgeText: { color: AppColors.white, fontSize: 13, fontWeight: '600' },
  livestockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  livestockItem: { alignItems: 'center', minWidth: 60 },
  livestockEmoji: { fontSize: 32 },
  livestockCount: { fontSize: 18, fontWeight: '700', color: AppColors.black, marginTop: 4 },
  livestockType: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  emptyText: { fontSize: 14, color: AppColors.gray, fontStyle: 'italic' },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherTemp: { fontSize: 36, fontWeight: '700', color: AppColors.black },
  weatherCondition: { fontSize: 15, color: AppColors.grayDark, flex: 1 },
  dzudBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dzudText: { color: AppColors.white, fontSize: 12, fontWeight: '600' },
  alertItem: {
    borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 8, marginBottom: 8,
    backgroundColor: '#FAFAFA', borderRadius: 6,
  },
  alertTitle: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  alertRegion: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  tipCard: { backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#C6F6D5' },
  tipText: { fontSize: 14, color: AppColors.grayDark, lineHeight: 20 },
  // Finance Summary
  financeContainer: { gap: 12 },
  financeRow: { flexDirection: 'row', gap: 12 },
  financeItem: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  financeLabel: { fontSize: 13, color: AppColors.grayDark, marginBottom: 4 },
  financeAmount: { fontSize: 18, fontWeight: '700' },
  profitRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14,
  },
  profitLabel: { fontSize: 14, fontWeight: '600', color: AppColors.black },
  profitAmount: { fontSize: 20, fontWeight: '800' },
  // Quick Actions Grid (2x3)
  quickActionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  gridActionBtn: {
    width: '31%', backgroundColor: '#F0FFF4', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#C6F6D5',
  },
  gridActionIcon: { fontSize: 28 },
  gridActionLabel: {
    fontSize: 12, fontWeight: '600', color: AppColors.primaryDark, marginTop: 8, textAlign: 'center',
  },
  // Existing quick actions row
  quickActions: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 12 },
  actionBtn: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 16, padding: 16,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: AppColors.grayDark, marginTop: 8 },
});
