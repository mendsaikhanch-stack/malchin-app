// Owner / Admin dashboard — WEB-ONLY route.
//
// Locked (CLAUDE.md §3): Mobile onboarding role picker-д БАЙХГҮЙ. Mobile
// деэр хүрэхгүй (zero nav link). Native platform-д хэрэглэгч хэрэв URL
// деэр шууд орвол placeholder харна. Веб-д л бүрэн dashboard.
//
// Ач холбогдол: Single-glance digest (6 locked асуултын хариу) + 5 alarm +
// 8 section карт (Growth/Revenue/ProductUsage/Geography/Organizations/
// Billing/Moderation/ContentOps). Бүх тоо `services/owner-dashboard-data.ts`
// pure helper-ээр тооцогдоно.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { AppColors } from '@/constants/theme';
import {
  fetchOwnerSnapshot,
  singleGlanceDigest,
  healthAlarms,
  totalRevenue,
  totalBillingRevenue,
  engagementRate,
  totalUsersByGeo,
  churnRatePct,
  dunningRatePct,
  moderationResolutionRate,
  coverageGapPct,
  contentReviewBacklogHours,
  totalContentPipeline,
  type OwnerSnapshot,
} from '@/services/owner-dashboard-data';

const ALARM_LABEL: Record<string, string> = {
  churn: 'Churn ≥ 10%',
  dunning: 'Dunning ≥ 5%',
  moderation: 'Moderation < 60% resolved',
  coverage: 'Coverage gap ≥ 20%',
  review_backlog: 'Review backlog ≥ 200ц',
};

const PACKAGE_LABEL: Record<string, string> = {
  free: 'Free',
  premium_malchin: 'Premium Малчин',
  cooperative: 'Хоршооны багц',
  sum_license: 'Сумын лиценз',
  verified_provider: 'Verified провайдер',
};

const FEATURE_LABEL: Record<string, string> = {
  home_feed: 'Home feed',
  weather: 'Цаг агаар',
  advisory: 'Зөвлөгөө',
  lost_found: 'Алдсан/Олдсон',
  market_listings: 'Зар',
  bag_dashboard: 'Багийн самбар',
  sum_dashboard: 'Сумын самбар',
  wisdom_feed: 'Ахмадын ухаан',
};

export default function OwnerDashboard() {
  const [snap, setSnap] = useState<OwnerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setLoading(false);
      return;
    }
    fetchOwnerSnapshot()
      .then(setSnap)
      .finally(() => setLoading(false));
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.placeholderWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.placeholderEmoji}>🖥️</Text>
        <Text style={styles.placeholderTitle}>Веб админ зөвхөн</Text>
        <Text style={styles.placeholderBody}>
          Owner dashboard нь зөвхөн веб админ хэсгээс нэвтрэх боломжтой.
          Гар утсанд харагдахгүй.
        </Text>
      </View>
    );
  }

  if (loading || !snap) {
    return (
      <View style={styles.loadingWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={AppColors.primary} size="large" />
        <Text style={styles.loadingText}>Snapshot ачааллаж байна...</Text>
      </View>
    );
  }

  const digest = singleGlanceDigest(snap);
  const alarms = healthAlarms(snap);
  const totalRev = totalRevenue(snap.revenue);
  const totalBill = totalBillingRevenue(snap.billing);
  const engagement = engagementRate(snap.growth);
  const totalGeoUsers = totalUsersByGeo(snap.geography);
  const churn = churnRatePct(snap.revenue);
  const dunning = dunningRatePct(snap.billing, snap.revenue);
  const modRate = moderationResolutionRate(snap.moderation);
  const covGap = coverageGapPct(snap.geography);
  const reviewHours = contentReviewBacklogHours(snap.contentOps);
  const pipeline = totalContentPipeline(snap.contentOps);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Owner dashboard' }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Owner dashboard</Text>
        <Text style={styles.headerSub}>
          Snapshot: {snap.asOf.slice(0, 16).replace('T', ' ')}
        </Text>
      </View>

      {/* Single-glance ribbon — 6 locked асуултын хариу */}
      <View style={styles.glanceRow}>
        <Glance label="Хэн?" value={digest.who.toLocaleString()} />
        <Glance label="Хаанаас?" value={digest.whereTop} />
        <Glance label="Яаж?" value={FEATURE_LABEL[digest.how] ?? digest.how} />
        <Glance
          label="Хэн төлж?"
          value={digest.whoPaysActive.toLocaleString()}
        />
        <Glance
          label="Аль багц үнэтэй?"
          value={
            digest.topRevenuePackage
              ? PACKAGE_LABEL[digest.topRevenuePackage] ?? digest.topRevenuePackage
              : '—'
          }
        />
        <Glance label="Аль аймаг идэвхтэй?" value={digest.topActiveSum} />
      </View>

      {/* Alarms */}
      {alarms.length > 0 ? (
        <View style={styles.alarmBox}>
          <Text style={styles.alarmTitle}>⚠ Сэрэмжлүүлэг ({alarms.length})</Text>
          <View style={styles.alarmList}>
            {alarms.map((a) => (
              <View key={a} style={styles.alarmChip}>
                <Text style={styles.alarmChipText}>{ALARM_LABEL[a] ?? a}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.healthyBox}>
          <Text style={styles.healthyText}>✓ Бүх 5 threshold normal</Text>
        </View>
      )}

      {/* 8 section card grid */}
      <View style={styles.grid}>
        {/* 1. Growth */}
        <Section title="📈 Growth" emoji="">
          <Kpi label="Нийт хэрэглэгч" value={snap.growth.totalUsers.toLocaleString()} />
          <Kpi label="Өнөөдөр идэвхтэй" value={snap.growth.activeToday.toLocaleString()} />
          <Kpi label="7 хоног идэвхтэй" value={snap.growth.activeThisWeek.toLocaleString()} />
          <Kpi label="Шинэ (7хон)" value={`+${snap.growth.newThisWeek}`} />
          <Kpi label="Engagement" value={`${engagement}%`} hint="active7d / total" />
          <Kpi label="Retention 7d" value={`${snap.growth.retention7d}%`} />
        </Section>

        {/* 2. Revenue */}
        <Section title="💰 Revenue">
          <Kpi label="MRR" value={`${snap.revenue.mrr.toLocaleString('mn-MN')}₮`} />
          <Kpi label="Σ byPackage" value={`${totalRev.toLocaleString('mn-MN')}₮`} />
          <Kpi label="Active subs" value={snap.revenue.activeSubscribers.toLocaleString()} />
          <Kpi
            label="Churn"
            value={`${churn}% (${snap.revenue.churnedThisMonth})`}
            warn={churn >= 10}
          />
          <View style={styles.divider} />
          {Object.entries(snap.revenue.byPackage).map(([k, v]) => (
            <KpiSmall
              key={k}
              label={PACKAGE_LABEL[k] ?? k}
              value={`${(v ?? 0).toLocaleString('mn-MN')}₮`}
            />
          ))}
        </Section>

        {/* 3. Product usage */}
        <Section title="🧭 Product usage">
          <Kpi label="Top feature" value={FEATURE_LABEL[snap.productUsage.topFeature] ?? snap.productUsage.topFeature} />
          <View style={styles.divider} />
          {Object.entries(snap.productUsage.featureCounts).map(([k, v]) => (
            <KpiSmall
              key={k}
              label={FEATURE_LABEL[k] ?? k}
              value={`${v.toLocaleString()} · DAU ${(snap.productUsage.dauPerFeature[k] ?? 0).toLocaleString()}`}
            />
          ))}
        </Section>

        {/* 4. Geography */}
        <Section title="🗺️ Geography">
          <Kpi label="Top аймаг" value={snap.geography.topAimag} />
          <Kpi
            label="Coverage"
            value={`${snap.geography.coveragePct}% (gap ${covGap}%)`}
            warn={covGap >= 20}
          />
          <Kpi label="Σ users (geo)" value={totalGeoUsers.toLocaleString()} />
          <View style={styles.divider} />
          {snap.geography.byAimag.map((a) => (
            <KpiSmall
              key={a.aimag}
              label={a.aimag}
              value={`${a.users.toLocaleString()} (active ${a.active.toLocaleString()})`}
            />
          ))}
        </Section>

        {/* 5. Organizations */}
        <Section title="🏢 Organizations">
          <Kpi label="Хоршоо" value={snap.organizations.coopCount.toLocaleString()} />
          <Kpi label="Сумын лиценз" value={snap.organizations.sumLicenseCount.toLocaleString()} />
          <Kpi label="Үйлчилгээ үзүүлэгч" value={snap.organizations.providerCount.toLocaleString()} />
          <Kpi label="Идэвхтэй" value={snap.organizations.activeOrgs.toLocaleString()} />
        </Section>

        {/* 6. Billing */}
        <Section title="💳 Payments & billing">
          <Kpi label="Digital" value={`${snap.billing.digitalRevenue.toLocaleString('mn-MN')}₮`} />
          <Kpi label="Invoice (B2G)" value={`${snap.billing.invoiceRevenue.toLocaleString('mn-MN')}₮`} />
          <Kpi label="Σ" value={`${totalBill.toLocaleString('mn-MN')}₮`} />
          <Kpi label="Pending invoices" value={snap.billing.pendingInvoices.toLocaleString()} />
          <Kpi
            label="Dunning"
            value={`${dunning}% (${snap.billing.dunningUsers})`}
            warn={dunning >= 5}
          />
        </Section>

        {/* 7. Moderation */}
        <Section title="🛡️ Moderation & trust">
          <Kpi label="Open reports" value={snap.moderation.openReports.toLocaleString()} />
          <Kpi label="Resolved (7хон)" value={snap.moderation.resolvedThisWeek.toLocaleString()} />
          <Kpi
            label="Resolution rate"
            value={`${modRate}%`}
            warn={modRate < 60}
          />
          <Kpi label="Blocked users" value={snap.moderation.blockedUsers.toLocaleString()} />
          <Kpi label="Verified users" value={snap.moderation.verifiedUsers.toLocaleString()} />
        </Section>

        {/* 8. Content ops */}
        <Section title="📝 Content operations">
          <Kpi label="Draft" value={snap.contentOps.draft.toLocaleString()} />
          <Kpi label="In review" value={snap.contentOps.inReview.toLocaleString()} />
          <Kpi label="Published" value={snap.contentOps.published.toLocaleString()} />
          <Kpi label="Archived" value={snap.contentOps.archived.toLocaleString()} />
          <Kpi label="Pipeline Σ" value={pipeline.toLocaleString()} />
          <Kpi
            label="Avg review"
            value={`${snap.contentOps.avgReviewHours}ц`}
          />
          <Kpi
            label="Backlog hours"
            value={`${reviewHours.toLocaleString()}ц`}
            warn={reviewHours >= 200}
          />
        </Section>
      </View>
    </ScrollView>
  );
}

function Glance({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.glance}>
      <Text style={styles.glanceLabel}>{label}</Text>
      <Text style={styles.glanceValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; emoji?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Kpi({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <View style={styles.kpiRow}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, warn && styles.kpiWarn]}>{value}</Text>
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  );
}

function KpiSmall({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiSmallRow}>
      <Text style={styles.kpiSmallLabel}>{label}</Text>
      <Text style={styles.kpiSmallValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 24, maxWidth: 1280, alignSelf: 'center', width: '100%' },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: AppColors.black },
  headerSub: { fontSize: 13, color: AppColors.grayDark, marginTop: 4 },
  glanceRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16,
  },
  glance: {
    flexGrow: 1, minWidth: 180, padding: 12,
    backgroundColor: AppColors.white, borderRadius: 12,
    borderWidth: 1, borderColor: AppColors.borderColor,
  },
  glanceLabel: { fontSize: 11, color: AppColors.grayDark, fontWeight: '700', textTransform: 'uppercase' },
  glanceValue: { fontSize: 18, color: AppColors.black, fontWeight: '700', marginTop: 4 },
  alarmBox: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: AppColors.warning, marginBottom: 16,
  },
  alarmTitle: { fontSize: 14, fontWeight: '800', color: AppColors.danger },
  alarmList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  alarmChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: AppColors.danger,
  },
  alarmChipText: { fontSize: 12, color: AppColors.white, fontWeight: '700' },
  healthyBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12,
    borderLeftWidth: 4, borderLeftColor: AppColors.success, marginBottom: 16,
  },
  healthyText: { fontSize: 14, fontWeight: '700', color: AppColors.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  section: {
    flexGrow: 1, flexBasis: 320, minWidth: 280,
    backgroundColor: AppColors.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: AppColors.borderColor,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: AppColors.black, marginBottom: 10,
  },
  sectionBody: {},
  divider: { height: 1, backgroundColor: AppColors.borderColor, marginVertical: 8 },
  kpiRow: { paddingVertical: 6 },
  kpiLabel: { fontSize: 12, color: AppColors.grayDark, fontWeight: '600' },
  kpiValue: { fontSize: 17, color: AppColors.black, fontWeight: '700', marginTop: 2 },
  kpiWarn: { color: AppColors.danger },
  kpiHint: { fontSize: 10, color: AppColors.gray, marginTop: 2 },
  kpiSmallRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  kpiSmallLabel: { fontSize: 12, color: AppColors.grayDark, flex: 1 },
  kpiSmallValue: { fontSize: 12, color: AppColors.black, fontWeight: '600' },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: { marginTop: 12, color: AppColors.grayDark, fontSize: 13 },
  placeholderWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, backgroundColor: '#F8F9FA',
  },
  placeholderEmoji: { fontSize: 56 },
  placeholderTitle: {
    fontSize: 20, fontWeight: '800', color: AppColors.black,
    marginTop: 12,
  },
  placeholderBody: {
    fontSize: 14, color: AppColors.grayDark, textAlign: 'center',
    marginTop: 8, maxWidth: 320, lineHeight: 20,
  },
});
