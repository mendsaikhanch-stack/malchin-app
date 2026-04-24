import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/constants/theme';
import { clearCache, getCacheSize } from '@/services/offline';
import {
  parseOnboardingSnapshot,
  toUserFallback,
  toLivestockStats,
  type OnboardingSnapshot,
  type UserFallback,
} from '@/services/onboarding-fallback';
import { clearAuthTokens } from '@/services/api';
import { useNetwork } from '@/hooks/use-network';
import { useElderFlag } from '@/hooks/use-elder-flag';
import { usePackage } from '@/hooks/use-package';
import { PACKAGES } from '@/services/pricing';

const ONBOARDING_DATA_KEY = '@malchin_onboarding_data';
const ONBOARDING_DONE_KEY = '@malchin_onboarding_done';

const roleLabels: Record<string, string> = {
  malchin: 'Малчин',
  bag_darga: 'Багийн дарга',
  sum_admin: 'Сумын удирдлага',
  khorshoo: 'Хоршоо',
  service_provider: 'Үйлчилгээ үзүүлэгч',
};

// Role-оос хамаарсан хяналтын самбарын маршрут
const roleDashboard: Record<string, { route: string; emoji: string; title: string; desc: string }> = {
  malchin: {
    route: '/(tabs)/manage',
    emoji: '⚙️',
    title: 'Миний удирдлага',
    desc: 'Сануулга, бүртгэл, санхүү',
  },
  bag_darga: {
    route: '/bag-dashboard',
    emoji: '👥',
    title: 'Багийн даргын самбар',
    desc: 'Өрхийн жагсаалт, мэдэгдэл, эрсдэл',
  },
  sum_admin: {
    route: '/sum-dashboard',
    emoji: '🏛️',
    title: 'Сумын удирдлагын самбар',
    desc: 'Багуудын тайлан, тооллого, broadcast',
  },
  khorshoo: {
    route: '/coop-dashboard',
    emoji: '🤝',
    title: 'Хоршооны самбар',
    desc: 'Гишүүд, бараа, худалдаа',
  },
  service_provider: {
    route: '/service-dashboard',
    emoji: '🛠️',
    title: 'Үйлчилгээний самбар',
    desc: 'Захиалга, хуваарь, орлого',
  },
};

const animalMeta: Array<{ key: keyof NonNullable<OnboardingSnapshot['livestock']>; emoji: string; label: string }> = [
  { key: 'horse', emoji: '🐎', label: 'Адуу' },
  { key: 'cow', emoji: '🐂', label: 'Үхэр' },
  { key: 'sheep', emoji: '🐑', label: 'Хонь' },
  { key: 'goat', emoji: '🐐', label: 'Ямаа' },
  { key: 'camel', emoji: '🐪', label: 'Тэмээ' },
];

const seasonMeta: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'winter', label: 'Өвөлжөө', emoji: '❄️' },
  { key: 'spring', label: 'Хаваржаа', emoji: '🌸' },
  { key: 'summer', label: 'Зуслан', emoji: '☀️' },
  { key: 'autumn', label: 'Намаржаа', emoji: '🍂' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const isConnected = useNetwork();
  const { enabled: elderEnabled, toggle: toggleElder } = useElderFlag();
  const { pkg } = usePackage();

  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [user, setUser] = useState<UserFallback | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      const snap = parseOnboardingSnapshot(raw);
      setSnapshot(snap);
      setUser(toUserFallback(snap));
    } catch {
      setSnapshot(null);
      setUser(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Онбординг дуусгаагүй — profile тab-д login/register form байршуулахгүй,
  // харин онбординг руу буцаах link үзүүлнэ (CLAUDE.md §4: onboarding = mandatory).
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{'🐎'}</Text>
          <Text style={styles.emptyTitle}>Онбординг дуусаагүй байна</Text>
          <Text style={styles.emptyText}>
            Профайлаа нээхийн тулд эхлээд бүртгэлээ үргэлжлүүлнэ үү.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={async () => {
              // Done flag үлдвэл layout guard буцаана — зайлуулж дараа нь шилжинэ
              await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
              router.replace('/onboarding' as any);
            }}
          >
            <Text style={styles.emptyBtnText}>Бүртгэл үргэлжлүүлэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const livestockStats = toLivestockStats(snapshot);
  const seasonal = snapshot?.seasonal || {};
  const pkgName = PACKAGES[pkg]?.name || 'Үнэгүй';

  const performLogout = async () => {
    try {
      // AsyncStorage + in-memory token cache цэвэрлэнэ. Хэрэв зөвхөн онбординг
      // key-ийг устгаад token үлдвэл дараагийн нэвтрэлтэд хуучин token-оор
      // 401 гарах эрсдэлтэй.
      await Promise.all([
        AsyncStorage.multiRemove([ONBOARDING_DATA_KEY, ONBOARDING_DONE_KEY]),
        clearAuthTokens(),
      ]);
      setSnapshot(null);
      setUser(null);
      router.replace('/onboarding' as any);
    } catch (e: any) {
      Alert.alert('Алдаа', `Гарах үед алдаа гарлаа: ${e?.message || 'тодорхойгүй'}`);
    }
  };

  const handleLogout = () => {
    Alert.alert('Гарах', 'Бүртгэлээ цэвэрлээд онбординг-руу буцах уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Тийм', style: 'destructive', onPress: performLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.name || 'М').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name || '—'}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <Text style={styles.userLocation}>
            {'📍'} {user.aimag}
            {user.sum ? `, ${user.sum}` : ''}
            {user.bag ? `, ${user.bag}` : ''}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabels[user.role] || user.role}</Text>
          </View>
          <View style={[styles.pkgBadge, pkg !== 'free' && styles.pkgBadgePremium]}>
            <Text style={[styles.pkgBadgeText, pkg !== 'free' && styles.pkgBadgeTextPremium]}>
              {pkg === 'free' ? '🔒' : '⭐'} {pkgName}
            </Text>
          </View>
        </View>

        {/* Хяналтын самбар — role-оос хамаарна */}
        {roleDashboard[user.role] && (
          <TouchableOpacity
            style={styles.dashboardCard}
            onPress={() => router.push(roleDashboard[user.role].route as any)}
          >
            <Text style={styles.dashboardEmoji}>{roleDashboard[user.role].emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashboardTitle}>{roleDashboard[user.role].title}</Text>
              <Text style={styles.dashboardDesc}>{roleDashboard[user.role].desc}</Text>
            </View>
            <Text style={styles.dashboardArrow}>{'›'}</Text>
          </TouchableOpacity>
        )}

        {/* Малын тоо */}
        {livestockStats && livestockStats.total_animals > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{'🐑'} Малын тоо</Text>
              <Text style={styles.cardTotalText}>Нийт {livestockStats.total_animals}</Text>
            </View>
            <View style={styles.animalRow}>
              {animalMeta.map((a) => {
                const count = snapshot?.livestock?.[a.key] ?? 0;
                if (count <= 0) return null;
                return (
                  <View key={a.key} style={styles.animalChip}>
                    <Text style={styles.animalEmoji}>{a.emoji}</Text>
                    <Text style={styles.animalCount}>{count}</Text>
                    <Text style={styles.animalLabel}>{a.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 4 улирлын байршил */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{'🗺️'} 4 улирлын байршил</Text>
          </View>
          {seasonMeta.map((s) => {
            const loc = seasonal[s.key];
            const hasData = loc && (loc.lat || loc.note);
            return (
              <View key={s.key} style={styles.seasonRow}>
                <Text style={styles.seasonEmoji}>{s.emoji}</Text>
                <Text style={styles.seasonLabel}>{s.label}</Text>
                <Text style={[styles.seasonValue, !hasData && styles.seasonValueEmpty]}>
                  {hasData
                    ? loc!.note || `${loc!.lat?.toFixed(2)}, ${loc!.lng?.toFixed(2)}`
                    : 'Тэмдэглээгүй'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Багц, privacy, elder */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/pricing' as any)}
          >
            <Text style={styles.menuIcon}>{'💳'}</Text>
            <Text style={styles.menuText}>Багц ба үнэ</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-settings' as any)}
          >
            <Text style={styles.menuIcon}>{'🔒'}</Text>
            <Text style={styles.menuText}>Нууцлал ба эрх</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'👴'}</Text>
            <Text style={styles.menuText}>Ахмадын ухаан оруулах</Text>
            <Switch
              value={elderEnabled}
              onValueChange={(next) => {
                toggleElder(next);
                if (next) router.push('/elder-content' as any);
              }}
              trackColor={{ false: AppColors.grayMedium, true: AppColors.primary }}
            />
          </View>
        </View>

        {/* Оффлайн */}
        <View style={styles.menuSection}>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>{'📡'}</Text>
            <Text style={styles.menuText}>Сүлжээний төлөв</Text>
            <Text style={[styles.networkText, { color: isConnected ? '#43A047' : '#E53935' }]}>
              {isConnected ? '✅ Онлайн' : '🟠 Оффлайн'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              const size = await getCacheSize();
              Alert.alert('Хадгалсан мэдээлэл', `${size.count} мэдээлэл хадгалагдсан`);
            }}
          >
            <Text style={styles.menuIcon}>{'💾'}</Text>
            <Text style={styles.menuText}>Хадгалсан мэдээлэл</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Cache цэвэрлэх', 'Бүх хадгалсан мэдээлэл устгах уу?', [
                { text: 'Болих' },
                {
                  text: 'Тийм',
                  style: 'destructive',
                  onPress: async () => {
                    await clearCache();
                    Alert.alert('Амжилттай', 'Cache цэвэрлэгдлээ');
                  },
                },
              ]);
            }}
          >
            <Text style={styles.menuIcon}>{'🗑️'}</Text>
            <Text style={styles.menuText}>Cache цэвэрлэх</Text>
            <Text style={styles.menuArrow}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Гарах</Text>
        </TouchableOpacity>

        <Text style={styles.version}>МАЛЧИН v3.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  // Empty (no onboarding)
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: AppColors.black, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 14, color: AppColors.grayDark, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 24, backgroundColor: AppColors.primary, paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 12,
  },
  emptyBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
  // Header
  profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: AppColors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: AppColors.white },
  userName: { fontSize: 22, fontWeight: '800', color: AppColors.black, marginTop: 12 },
  userPhone: { fontSize: 15, color: AppColors.grayDark, marginTop: 4 },
  userLocation: { fontSize: 13, color: AppColors.gray, marginTop: 4, textAlign: 'center' },
  roleBadge: {
    marginTop: 10, backgroundColor: AppColors.primary + '18',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  pkgBadge: {
    marginTop: 8, backgroundColor: AppColors.grayMedium + '40',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  pkgBadgePremium: { backgroundColor: '#FFF3E0' },
  pkgBadgeText: { fontSize: 11, fontWeight: '600', color: AppColors.grayDark },
  pkgBadgeTextPremium: { color: '#E65100', fontWeight: '700' },
  // Dashboard card (role-оос хамаарсан)
  dashboardCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    padding: 16, borderRadius: 14,
    backgroundColor: AppColors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  dashboardEmoji: { fontSize: 32, marginRight: 14 },
  dashboardTitle: { fontSize: 15, fontWeight: '800', color: AppColors.white },
  dashboardDesc: { fontSize: 12, color: AppColors.white, opacity: 0.85, marginTop: 3 },
  dashboardArrow: { fontSize: 24, color: AppColors.white, fontWeight: '600' },
  // Cards
  card: {
    backgroundColor: AppColors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: AppColors.black },
  cardTotalText: { fontSize: 12, color: AppColors.gray, fontWeight: '600' },
  // Livestock
  animalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  animalChip: {
    alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, minWidth: 60,
  },
  animalEmoji: { fontSize: 22 },
  animalCount: { fontSize: 15, fontWeight: '800', color: AppColors.black, marginTop: 2 },
  animalLabel: { fontSize: 10, color: AppColors.gray, marginTop: 1 },
  // Seasonal rows
  seasonRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  seasonEmoji: { fontSize: 18, width: 28 },
  seasonLabel: { fontSize: 13, fontWeight: '600', color: AppColors.black, width: 80 },
  seasonValue: { flex: 1, fontSize: 12, color: AppColors.grayDark, textAlign: 'right' },
  seasonValueEmpty: { color: AppColors.gray, fontStyle: 'italic' },
  // Menu
  menuSection: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: AppColors.white,
    borderRadius: 14, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '500', color: AppColors.black },
  menuArrow: { fontSize: 20, color: AppColors.gray },
  networkText: { fontSize: 12, fontWeight: '600' },
  // Logout
  logoutBtn: {
    marginHorizontal: 16, marginTop: 20, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: AppColors.danger, alignItems: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: AppColors.danger },
  version: { textAlign: 'center', fontSize: 11, color: AppColors.gray, marginTop: 20 },
});
