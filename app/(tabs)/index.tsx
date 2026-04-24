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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/constants/theme';
import {
  livestockApi,
  weatherApi,
  alertsApi,
  aiApi,
  financeApi,
  marketApi,
  pricesApi,
  healthApi,
  newsApi,
} from '@/services/api';
import {
  parseOnboardingSnapshot,
  toLivestockStats,
} from '@/services/onboarding-fallback';
import {
  normalizeBackendWeather,
  normalizeOpenWeather,
  type NormalizedWeather,
} from '@/services/weather-provider';
import { StaleBadge } from '@/components/stale-badge';
import type { CacheMeta } from '@/services/cache-state';
import { AdBanner, AdBannerLarge } from '@/components/ad-banner';
import { useLocation } from '@/hooks/use-location';
import { useUserRole, ROLE_LABEL, ROLE_EMOJI } from '@/hooks/use-user-role';
import { useHomeFeed } from '@/hooks/use-home-feed';
import { getDailyTasks, type DailyTask } from '@/services/daily-tasks';
import { getMigrationAdvice, type MigrationAdvice } from '@/services/migration-advice';

const animalNames: Record<string, string> = {
  sheep: 'Хонь', goat: 'Ямаа', cattle: 'Үхэр', cow: 'Үхэр',
  horse: 'Адуу', camel: 'Тэмээ',
};

const ONBOARDING_DATA_KEY = '@malchin_onboarding_data';

// Онбординг-д бүртгэсэн малын тоог backend-ийн format руу хөрвүүлэх
// (pure logic нь services/onboarding-fallback.ts-д; энд зөвхөн AsyncStorage уншина)
async function loadLivestockFromOnboarding() {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    return toLivestockStats(parseOnboardingSnapshot(raw));
  } catch {
    return null;
  }
}

// conditionMn/dzudMn logic нь services/weather-provider.ts-д pure хэлбэрээр
// (conditionLabel, dzudLabel). Home нь normalizeBackendWeather()-оор дамжина.

const animalEmojis: Record<string, string> = {
  sheep: '🐑', goat: '🐐', cattle: '🐂',
  horse: '🐎', camel: '🐪',
};

const quickActionItems = [
  { emoji: '🐑', label: 'Мал бүртгэл', route: '/livestock' },
  { emoji: '🔍', label: 'Алдсан/Олдсон', route: '/lost-found' },
  { emoji: '🩺', label: 'Мал эмч', route: '/vet-booking' },
  { emoji: '🤰', label: 'Хээлтүүлэг', route: '/breeding' },
  { emoji: '🏥', label: 'Эрүүл мэнд', route: '/health' },
  { emoji: '🌿', label: 'Бэлчээр', route: '/pasture' },
  { emoji: '📰', label: 'Мэдээ', route: '/news' },
  { emoji: '👨‍👩‍👧‍👦', label: 'Өрх бүл', route: '/household' },
  { emoji: '📍', label: 'Газрын зураг', route: '/map-view' },
  { emoji: '💰', label: 'Санхүү', route: '/finance' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { address: myLocation, loading: locLoading } = useLocation();
  const { role, name: userName } = useUserRole();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [migrationAdvice, setMigrationAdvice] = useState<MigrationAdvice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [weather, setWeather] = useState<NormalizedWeather | null>(null);
  const emptyMeta: CacheMeta = { fromCache: false, offline: false, expired: false };
  const [weatherMeta, setWeatherMeta] = useState<CacheMeta>(emptyMeta);
  const [alertsMeta, setAlertsMeta] = useState<CacheMeta>(emptyMeta);
  const [announcementMeta, setAnnouncementMeta] = useState<CacheMeta>(emptyMeta);
  const [marketPricesMeta, setMarketPricesMeta] = useState<CacheMeta>(emptyMeta);
  const [listingsMeta, setListingsMeta] = useState<CacheMeta>(emptyMeta);
  const [healthMeta, setHealthMeta] = useState<CacheMeta>(emptyMeta);
  const [tipMeta, setTipMeta] = useState<CacheMeta>(emptyMeta);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tip, setTip] = useState('');
  const [finance, setFinance] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);
  const [announcement, setAnnouncement] = useState<any>(null);

  const userId = 1;

  // Home feed rule engine: preferences + role + season + location-ээс card-ууд шийдэгдэнэ
  const { visibleCards, context: homeCtx } = useHomeFeed({
    role,
    hasLivestock: totalAnimals > 0,
    hasHighAlert: alerts.some((a: any) => a.severity === 'high'),
  });

  const loadData = async () => {
    try {
      const userAimag = homeCtx?.aimag || '';
      const [
        statsRes, weatherRes, alertsRes, tipRes, financeRes,
        pricesRes, listingsRes, healthRes, newsRes,
      ] = await Promise.allSettled([
        livestockApi.getStats(userId),
        weatherApi.getByAimagWithMeta(userAimag || 'Төв'),
        alertsApi.getAllWithMeta(userAimag || undefined),
        aiApi.getTipWithMeta(),
        financeApi.getSummary(),
        pricesApi.getSummaryWithMeta(),
        marketApi.getAllWithMeta(userAimag ? { location: userAimag } : undefined),
        healthApi.getStatsWithMeta(),
        newsApi.getAllWithMeta(),
      ]);

      // Backend-ээс ирсэн тоо эсвэл онбординг data-аас fallback
      let stats: { livestock: any[]; total_animals: number } | null = null;
      if (statsRes.status === 'fulfilled' && statsRes.value?.total_animals > 0) {
        stats = statsRes.value;
      } else {
        stats = await loadLivestockFromOnboarding();
      }
      if (stats) {
        const items = stats.livestock.map((item: any) => ({
          ...item,
          emoji: animalEmojis[item.animal_type] || '🐾',
        }));
        setLivestock(items);
        setTotalAnimals(stats.total_animals || 0);
      }
      if (weatherRes.status === 'fulfilled') {
        const wr = weatherRes.value;
        const normalized =
          wr.provider === 'openweather'
            ? normalizeOpenWeather(wr.data, userAimag || 'Төв')
            : normalizeBackendWeather(wr.data);
        setWeather(normalized);
        setWeatherMeta({
          fromCache: wr.fromCache,
          offline: wr.offline,
          expired: wr.expired,
        });
      }
      if (alertsRes.status === 'fulfilled') {
        const ar = alertsRes.value;
        setAlerts((ar.data || []).slice(0, 3));
        setAlertsMeta({ fromCache: ar.fromCache, offline: ar.offline, expired: ar.expired });
      }
      if (tipRes.status === 'fulfilled') {
        const tr = tipRes.value;
        setTip(tr.data?.tip || '');
        setTipMeta({ fromCache: tr.fromCache, offline: tr.offline, expired: tr.expired });
      }
      if (financeRes.status === 'fulfilled') setFinance(financeRes.value);
      if (pricesRes.status === 'fulfilled') {
        const pr = pricesRes.value;
        setMarketPrices(pr.data);
        setMarketPricesMeta({ fromCache: pr.fromCache, offline: pr.offline, expired: pr.expired });
      }
      if (listingsRes.status === 'fulfilled') {
        const lr = listingsRes.value;
        const payload = lr.data;
        const arr = Array.isArray(payload)
          ? payload
          : payload?.items || payload?.data || [];
        setListings(arr.slice(0, 3));
        setListingsMeta({ fromCache: lr.fromCache, offline: lr.offline, expired: lr.expired });
      }
      if (healthRes.status === 'fulfilled') {
        const hr = healthRes.value;
        setHealthStats(hr.data);
        setHealthMeta({ fromCache: hr.fromCache, offline: hr.offline, expired: hr.expired });
      }
      if (newsRes.status === 'fulfilled') {
        const nr = newsRes.value;
        const payload = nr.data;
        const arr = Array.isArray(payload)
          ? payload
          : payload?.items || payload?.data || [];
        setAnnouncement(arr[0] || null);
        setAnnouncementMeta({ fromCache: nr.fromCache, offline: nr.offline, expired: nr.expired });
      }
    } catch {
      // show what we can
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // homeCtx бэлэн болмогц (aimag уншигдсан) бодит аймаг-ын мэдээллээр дахин дуудна
  useEffect(() => { loadData(); }, [homeCtx?.aimag]);

  useEffect(() => {
    const tasks = getDailyTasks({
      month: new Date().getMonth() + 1,
      role,
      hasLivestock: totalAnimals > 0,
      weatherTemp: weather?.temp ?? undefined,
      dzudRisk: weather?.dzudRisk === 'unknown' ? undefined : weather?.dzudRisk,
      hasHighAlert: alerts.some((a: any) => a.severity === 'high'),
    });
    setDailyTasks(tasks);

    setMigrationAdvice(
      getMigrationAdvice({
        month: new Date().getMonth() + 1,
        weatherTemp: weather?.temp ?? undefined,
        dzudRisk: weather?.dzudRisk === 'unknown' ? undefined : weather?.dzudRisk,
      })
    );
  }, [role, totalAnimals, weather, alerts]);

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {userName ? `Сайн байна уу, ${userName}!` : 'Сайн байна уу!'}
              </Text>
              <Text style={styles.appTitle}>МАЛЧИН</Text>
              {myLocation ? (
                <Text style={styles.locationText}>📍 {myLocation}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.inboxBtn}
              onPress={() => router.push('/inbox' as any)}
            >
              <Text style={styles.inboxIcon}>🔔</Text>
              <View style={styles.inboxDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role banner — зөвхөн malchin биш role-д харагдана */}
        {role && role !== 'malchin' && (
          <TouchableOpacity
            style={styles.roleBanner}
            onPress={() => {
              if (role === 'bag_darga') router.push('/bag-dashboard' as any);
              else if (role === 'sum_admin') router.push('/sum-dashboard' as any);
              else if (role === 'khorshoo') router.push('/coop-dashboard' as any);
              else router.push('/service-dashboard' as any);
            }}
          >
            <Text style={styles.roleEmoji}>{ROLE_EMOJI[role]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>{ROLE_LABEL[role]} хяналт</Text>
              <Text style={styles.roleDesc}>Ажлын хяналтын самбар руу очих</Text>
            </View>
            <Text style={styles.roleArrow}>›</Text>
          </TouchableOpacity>
        )}

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

        {/* Цаг агаар — rule engine: preferences.weather */}
        {visibleCards.has('weather') && (
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/weather')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>⛅ Цаг агаар - {weather?.aimag || 'Төв'}</Text>
            <StaleBadge {...weatherMeta} compact />
          </View>
          {weather ? (
            <View style={styles.weatherRow}>
              <Text style={styles.weatherTemp}>{weather.temp ?? '—'}°C</Text>
              <Text style={styles.weatherCondition}>{weather.conditionLabel}</Text>
              <View style={[styles.dzudBadge, { backgroundColor: dzudColor(weather.dzudRisk) }]}>
                <Text style={styles.dzudText}>Зуд: {weather.dzudLabel}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Цаг агаарын мэдээ ачааллаж чадсангүй</Text>
          )}
        </TouchableOpacity>
        )}

        {/* Сурталчилгаа */}
        <AdBanner placement="home" />

        {/* Өнөөдөр хийх 3 ажил — rule engine: бүгдэд харагдана */}
        {dailyTasks.length > 0 && visibleCards.has('daily_tasks') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Өнөөдөр хийх 3 ажил</Text>
            {dailyTasks.map((t, i) => (
              <View key={t.id} style={styles.taskItem}>
                <View style={[
                  styles.taskNum,
                  t.priority === 'high' && { backgroundColor: AppColors.danger },
                  t.priority === 'medium' && { backgroundColor: AppColors.warning },
                ]}>
                  <Text style={styles.taskNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>
                    {t.emoji} {t.title}
                  </Text>
                  <Text style={styles.taskDetail}>{t.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Сэрэмжлүүлэг — rule engine: preferences.alerts (risk card) */}
        {alerts.length > 0 && visibleCards.has('risk') && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>🚨 Сэрэмжлүүлэг</Text>
              <StaleBadge {...alertsMeta} compact />
            </View>
            {alerts.map((alert: any) => (
              <View key={alert.id} style={[styles.alertItem, { borderLeftColor: severityColor(alert.severity) }]}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertRegion}>{alert.region}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Нүүх/Оторлох зөвлөгөө — rule engine: preferences + role + мал байгаа эсэх */}
        {migrationAdvice && visibleCards.has('migration_advice') && (
          <View style={[
            styles.card,
            migrationAdvice.urgency === 'now' && { borderLeftWidth: 4, borderLeftColor: AppColors.danger },
            migrationAdvice.urgency === 'soon' && { borderLeftWidth: 4, borderLeftColor: AppColors.warning },
          ]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>
                {migrationAdvice.action === 'move' ? '🚶 Нүүх зөвлөгөө' :
                 migrationAdvice.action === 'prepare' ? '🎒 Нүүдлийн бэлтгэл' :
                 migrationAdvice.action === 'otor' ? '⚠️ Оторлох санал' : '🏕️ Байрандаа'}
              </Text>
              <View style={[
                styles.urgencyBadge,
                migrationAdvice.urgency === 'now' && { backgroundColor: AppColors.danger },
                migrationAdvice.urgency === 'soon' && { backgroundColor: AppColors.warning },
              ]}>
                <Text style={styles.urgencyText}>
                  {migrationAdvice.urgency === 'now' ? 'Яаралтай' :
                   migrationAdvice.urgency === 'soon' ? 'Удахгүй' : 'Тогтвортой'}
                </Text>
              </View>
            </View>
            <Text style={styles.migrationTitle}>{migrationAdvice.title}</Text>
            {migrationAdvice.reasons.slice(0, 2).map((r, i) => (
              <Text key={i} style={styles.migrationReason}>• {r}</Text>
            ))}
            {migrationAdvice.steps.length > 0 && (
              <View style={styles.migrationSteps}>
                <Text style={styles.migrationStepsTitle}>Үе шат:</Text>
                {migrationAdvice.steps.slice(0, 3).map((s, i) => (
                  <Text key={i} style={styles.migrationStep}>
                    {i + 1}. {s}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Өдрийн зөвлөгөө + 15 бэлэн асуулт shortcut */}
        {visibleCards.has('elder_wisdom') ? (
          <TouchableOpacity style={[styles.card, styles.tipCard]} onPress={() => router.push('/advisory' as any)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.cardTitle}>💡 Өдрийн зөвлөгөө</Text>
                <StaleBadge {...tipMeta} compact />
              </View>
              <View style={styles.advisoryCountBadge}>
                <Text style={styles.advisoryCountText}>15 асуулт</Text>
              </View>
            </View>
            {tip ? (
              <Text style={styles.tipText}>{tip}</Text>
            ) : (
              <Text style={styles.tipText}>
                Хэзээ нүүх · Сульдсан малыг тордох · Зудын бэлтгэл... 👉
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Малын эрүүл мэндийн дохио — rule engine: livestock_health (мал бүртгэлтэй бол) */}
        {healthStats && visibleCards.has('livestock_health') && (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/health')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>🩺 Малын эрүүл мэнд</Text>
              <StaleBadge {...healthMeta} compact />
            </View>
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>
                  {healthStats.active ?? healthStats.open_cases ?? 0}
                </Text>
                <Text style={styles.miniStatLabel}>Идэвхтэй хэрэг</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: AppColors.warning }]}>
                  {healthStats.due_vaccinations ?? healthStats.upcoming ?? 0}
                </Text>
                <Text style={styles.miniStatLabel}>Дараа вакцин</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: AppColors.danger }]}>
                  {healthStats.severe ?? healthStats.high_severity ?? 0}
                </Text>
                <Text style={styles.miniStatLabel}>Яаралтай</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Сумын шинэ мэдэгдэл — rule engine: sum_announcement (аймаг тодорхой бол) */}
        {announcement && visibleCards.has('sum_announcement') && (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/news')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>📢 Сумын шинэ мэдэгдэл</Text>
              <StaleBadge {...announcementMeta} compact />
            </View>
            <Text style={styles.announceTitle} numberOfLines={2}>
              {announcement.title || announcement.name || '—'}
            </Text>
            {announcement.summary || announcement.description ? (
              <Text style={styles.announceSummary} numberOfLines={2}>
                {announcement.summary || announcement.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}

        {/* Зах зээлийн товч үнэ — rule engine: market_prices (preferences.market) */}
        {marketPrices && visibleCards.has('market_prices') && (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/market')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>💹 Зах зээлийн үнэ</Text>
              <StaleBadge {...marketPricesMeta} compact />
            </View>
            <View style={styles.miniStatsRow}>
              {(Array.isArray(marketPrices)
                ? marketPrices
                : marketPrices.items || marketPrices.data || []
              )
                .slice(0, 3)
                .map((p: any, i: number) => (
                  <View key={i} style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>
                      {formatMoney(p.price || p.avg_price || 0)}
                    </Text>
                    <Text style={styles.miniStatLabel} numberOfLines={1}>
                      {p.item_type || p.name || p.animal_type || '—'}
                    </Text>
                  </View>
                ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Ойролцоох хэрэгтэй зар — rule engine: nearby_listings (preferences.listings) */}
        {listings.length > 0 && visibleCards.has('nearby_listings') && (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/market')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>📣 Ойролцоох зар</Text>
              <StaleBadge {...listingsMeta} compact />
            </View>
            {listings.map((l: any, i: number) => (
              <View key={l.id ?? i} style={styles.listingItem}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {l.title || l.name || l.animal_type || 'Зар'}
                </Text>
                <Text style={styles.listingMeta}>
                  {l.price ? formatMoney(l.price) : ''}
                  {l.location ? ` · ${l.location}` : ''}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}

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

        {/* Даатгал & Халамж */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/insurance')}>
          <Text style={styles.cardTitle}>🛡️ Даатгал & Халамж</Text>
          <View style={styles.insuranceGrid}>
            <View style={styles.insuranceItem}>
              <Text style={styles.insuranceEmoji}>🏦</Text>
              <Text style={styles.insuranceLabel}>НД 11.5%</Text>
            </View>
            <View style={styles.insuranceItem}>
              <Text style={styles.insuranceEmoji}>🏥</Text>
              <Text style={styles.insuranceLabel}>ЭМД</Text>
            </View>
            <TouchableOpacity style={styles.insuranceItem} onPress={() => router.push('/(tabs)/livestock-insurance')}>
              <Text style={styles.insuranceEmoji}>🐑</Text>
              <Text style={[styles.insuranceLabel, { color: '#2d5016', fontWeight: '700' }]}>Малын даатгал</Text>
            </TouchableOpacity>
            <View style={styles.insuranceItem}>
              <Text style={styles.insuranceEmoji}>🤝</Text>
              <Text style={styles.insuranceLabel}>Халамж</Text>
            </View>
          </View>
          <View style={styles.insuranceTip}>
            <Text style={styles.insuranceTipText}>
              💡 Шимтгэл, тэтгэвэр, малын даатгал, тооцоолуур →
            </Text>
          </View>
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

        {/* Өрхийн хөгжил — шинэ модулиуд */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Өрхийн хөгжил</Text>
          <View style={styles.moduleGrid}>
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => router.push('/malchin-khun' as any)}
            >
              <Text style={styles.moduleEmoji}>🩺</Text>
              <Text style={styles.moduleLabel}>Малчин хүн</Text>
              <Text style={styles.moduleDesc}>Эрүүл мэнд, ЭМД</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => router.push('/family-future' as any)}
            >
              <Text style={styles.moduleEmoji}>🎓</Text>
              <Text style={styles.moduleLabel}>Өрх-ирээдүй</Text>
              <Text style={styles.moduleDesc}>Хүүхэд, тэтгэлэг</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => router.push('/extra-income' as any)}
            >
              <Text style={styles.moduleEmoji}>💼</Text>
              <Text style={styles.moduleLabel}>Нэмэлт орлого</Text>
              <Text style={styles.moduleDesc}>Гэр буудал, идээ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => router.push('/chat' as any)}
            >
              <Text style={styles.moduleEmoji}>💬</Text>
              <Text style={styles.moduleLabel}>Чат</Text>
              <Text style={styles.moduleDesc}>Сум, баг, хоршоо</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => router.push('/wisdom-feed' as any)}
            >
              <Text style={styles.moduleEmoji}>👴</Text>
              <Text style={styles.moduleLabel}>Малчны ухаан</Text>
              <Text style={styles.moduleDesc}>Ахмад, мэргэжилтэн</Text>
            </TouchableOpacity>
          </View>
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
  locationText: { fontSize: 13, color: AppColors.grayDark, marginTop: 4 },
  inboxBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  inboxIcon: { fontSize: 22 },
  inboxDot: {
    position: 'absolute', top: 8, right: 10,
    width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.danger,
    borderWidth: 2, borderColor: AppColors.white,
  },
  roleBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: AppColors.primary, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  roleEmoji: { fontSize: 30, marginRight: 12 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: AppColors.white },
  roleDesc: { fontSize: 12, color: '#E8F5E9', marginTop: 2 },
  roleArrow: { fontSize: 28, color: AppColors.white, fontWeight: '700' },
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
  advisoryCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AppColors.primary,
    borderRadius: 10,
  },
  advisoryCountText: {
    fontSize: 11,
    color: AppColors.white,
    fontWeight: '700',
  },
  taskItem: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 10,
  },
  taskNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  taskNumText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  taskTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  taskDetail: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleItem: {
    width: '47%', backgroundColor: '#F0FFF4', borderRadius: 12,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#C6F6D5',
  },
  moduleEmoji: { fontSize: 30 },
  moduleLabel: { fontSize: 13, fontWeight: '700', color: AppColors.primaryDark, marginTop: 6 },
  moduleDesc: { fontSize: 11, color: AppColors.grayDark, marginTop: 3, textAlign: 'center' },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: AppColors.grayLight },
  urgencyText: { fontSize: 11, fontWeight: '700', color: AppColors.white },
  migrationTitle: { fontSize: 15, fontWeight: '700', color: AppColors.black, marginTop: 8 },
  migrationReason: { fontSize: 13, color: AppColors.grayDark, marginTop: 4 },
  migrationSteps: {
    marginTop: 10, padding: 10, backgroundColor: '#F0FFF4', borderRadius: 8,
  },
  migrationStepsTitle: { fontSize: 12, fontWeight: '700', color: AppColors.primaryDark },
  migrationStep: { fontSize: 12, color: AppColors.grayDark, marginTop: 4, lineHeight: 18 },
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
  // Insurance grid (2x2)
  insuranceGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4,
  },
  insuranceItem: {
    width: '47%', backgroundColor: '#F0FFF4', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#C6F6D5',
  },
  insuranceEmoji: { fontSize: 26 },
  insuranceLabel: {
    fontSize: 13, fontWeight: '600', color: AppColors.grayDark, marginTop: 6,
  },
  insuranceTip: {
    marginTop: 12, padding: 10, backgroundColor: '#FFFBEA',
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: AppColors.secondary,
  },
  insuranceTipText: { fontSize: 13, color: AppColors.grayDark, lineHeight: 18 },
  // PRD cards: livestock_health / sum_announcement / market_prices / nearby_listings
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.black,
  },
  miniStatLabel: {
    fontSize: 11,
    color: AppColors.grayDark,
    marginTop: 4,
    textAlign: 'center',
  },
  announceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.black,
    marginTop: 4,
  },
  announceSummary: {
    fontSize: 13,
    color: AppColors.grayDark,
    marginTop: 4,
    lineHeight: 18,
  },
  listingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayLight,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
  },
  listingMeta: {
    fontSize: 12,
    color: AppColors.grayDark,
    marginTop: 2,
  },
});
