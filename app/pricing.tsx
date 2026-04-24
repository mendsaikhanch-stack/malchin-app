import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { usePackage } from '@/hooks/use-package';
import {
  PACKAGES,
  featuresOfPackage,
  type PackageId,
  type FeatureKey,
} from '@/services/pricing';

// Monggol tайлбар feature-ийн display нэр
const FEATURE_LABEL: Record<FeatureKey, string> = {
  advisory_limited: 'Ухаалаг зөвлөгөө — 3/сар',
  advisory_unlimited: 'Ухаалаг зөвлөгөө — хязгааргүй',
  weather_basic: 'Цаг агаар — 3 өдөр',
  weather_extended: 'Цаг агаар — 14 өдөр + NDVI',
  bag_dashboard_basic: 'Багийн даргын хяналт',
  sum_dashboard_basic: 'Сумын суурь самбар',
  sum_dashboard_full: 'Сумын advanced (heatmap, export)',
  lost_found_view: 'Алдсан/олдсон мал харах',
  lost_found_create: 'Алдсан/олдсон мал зарлах',
  listings_view: 'Зарын жагсаалт',
  listings_create_basic: 'Зар оруулах — 3 идэвхтэй',
  listings_create_unlimited: 'Зар оруулах — хязгааргүй',
  coop_commerce: 'Хоршооны худалдаа',
  coop_seat_management: 'Хоршооны гишүүн удирдлага',
  provider_profile: 'Үйлчилгээ үзүүлэгч профайл',
  provider_booking: 'Захиалга',
  provider_commission: 'Комисс + payout',
  offline_sync_basic: 'Оффлайн sync',
  offline_sync_bulk: 'Оффлайн bulk (history, market)',
};

const PACKAGE_EMOJI: Record<PackageId, string> = {
  free: '🌱',
  premium_malchin: '⭐',
  cooperative: '🤝',
  sum_license: '🏛️',
  verified_provider: '🛠️',
};

const PACKAGE_PRICE: Record<PackageId, string> = {
  free: '0₮',
  premium_malchin: '9,900₮ / сар',
  cooperative: 'Үнийн санал',
  sum_license: 'Жилийн гэрээ',
  verified_provider: '19,900₮ / сар + комисс',
};

const PACKAGE_ORDER: PackageId[] = [
  'free',
  'premium_malchin',
  'cooperative',
  'sum_license',
  'verified_provider',
];

export default function PricingScreen() {
  const router = useRouter();
  const { pkg: current, loading, updatePackage } = usePackage();

  const selectPackage = (id: PackageId) => {
    if (id === current) return;
    if (id === 'free') {
      Alert.alert('Багц', 'Үнэгүй багц руу буцлаа');
      updatePackage(id);
      return;
    }
    const meta = PACKAGES[id];
    Alert.alert(
      meta.name,
      meta.billing === 'digital'
        ? 'Digital төлбөр (QPay/card) хараахан идэвхжээгүй. Phase 2-д автоматаар холбогдоно.'
        : 'Энэ багц invoice-оор идэвхждэг — хоршоо/сумын удирдлагатай холбогдох шаардлагатай.',
      [
        { text: 'Хаах', style: 'cancel' },
        {
          text: 'Багцыг сонгох (demo)',
          onPress: () => updatePackage(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Багц ба үнэ</Text>
          <Text style={styles.headerSubtitle}>5 багц · Malchin MVP</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.note}>
            <Text style={styles.noteTitle}>ℹ️ Одоогийн багц</Text>
            <Text style={styles.noteText}>
              {PACKAGE_EMOJI[current]} {PACKAGES[current].name}
            </Text>
          </View>

          {PACKAGE_ORDER.map((id) => {
            const meta = PACKAGES[id];
            const features = featuresOfPackage(id);
            const isCurrent = id === current;
            return (
              <View key={id} style={[styles.card, isCurrent && styles.cardActive]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardEmoji}>{PACKAGE_EMOJI[id]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{meta.name}</Text>
                    <Text style={styles.cardPrice}>{PACKAGE_PRICE[id]}</Text>
                    <Text style={styles.cardBilling}>
                      {meta.billing === 'digital'
                        ? 'QPay/картын автомат'
                        : 'Invoice / гэрээ'}
                    </Text>
                  </View>
                  {isCurrent ? (
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Идэвхтэй</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.featureList}>
                  {features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={styles.checkIcon}>✓</Text>
                      <Text style={styles.featureText}>
                        {FEATURE_LABEL[f]}
                      </Text>
                    </View>
                  ))}
                </View>

                {!isCurrent ? (
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => selectPackage(id)}
                  >
                    <Text style={styles.selectBtnText}>
                      {id === 'free' ? 'Үнэгүйг сонгох' : 'Сонгох'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}

          <Text style={styles.footnote}>
            Төлбөрийн систем (QPay, invoice) хараахан идэвхжээгүй — Phase 2-д
            холбогдоно. Demo горимд багцыг шууд сонгох боломжтой.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grayLight,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: AppColors.black, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.black },
  headerSubtitle: { fontSize: 12, color: AppColors.grayDark, marginTop: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16 },
  note: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noteTitle: { fontSize: 13, fontWeight: '600', color: AppColors.grayDark },
  noteText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.black,
    marginTop: 4,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 32 },
  cardName: { fontSize: 16, fontWeight: '700', color: AppColors.black },
  cardPrice: { fontSize: 14, color: AppColors.primary, fontWeight: '600', marginTop: 2 },
  cardBilling: { fontSize: 11, color: AppColors.gray, marginTop: 2 },
  badgeActive: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeActiveText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
  featureList: { marginTop: 4 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  checkIcon: {
    fontSize: 13,
    color: AppColors.success,
    fontWeight: '700',
    marginTop: 1,
  },
  featureText: { fontSize: 13, color: AppColors.grayDark, flex: 1 },
  selectBtn: {
    marginTop: 12,
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectBtnText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
  footnote: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 8,
    lineHeight: 18,
    textAlign: 'center',
  },
});
