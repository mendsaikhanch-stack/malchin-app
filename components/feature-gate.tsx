import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { usePackage } from '@/hooks/use-package';
import {
  cheapestUpgrade,
  PACKAGES,
  type FeatureKey,
} from '@/services/pricing';

type FeatureGateProps = {
  feature: FeatureKey;
  children: React.ReactNode;
  // Хандах эрхгүй үед юу харуулах. Default — UpgradePrompt (compact).
  fallback?: React.ReactNode;
};

// Access-ыг шалгаж children эсвэл fallback рендерлэнэ.
// Loading үед null (skeleton ihenh screen-д ач холбогдолгүй).
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { has, loading } = usePackage();
  if (loading) return null;
  if (has(feature)) return <>{children}</>;
  return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
}

type UpgradePromptProps = {
  feature: FeatureKey;
  // compact=true үед жижиг banner, false (default) үед том card
  compact?: boolean;
  style?: ViewStyle;
};

// "Энэ feature нь X багцад нээгдэнэ" CTA — pricing screen руу link.
export function UpgradePrompt({ feature, compact, style }: UpgradePromptProps) {
  const router = useRouter();
  const required = cheapestUpgrade(feature);
  if (!required) return null; // feature free-ээр нээлттэй — prompt хэрэггүй

  const meta = PACKAGES[required];
  const onPress = () => router.push('/pricing' as any);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.compactRow, style]}
        accessibilityRole="button"
      >
        <Text style={styles.compactIcon}>🔒</Text>
        <Text style={styles.compactText}>
          {meta.name} багцад нээгдэнэ
        </Text>
        <Text style={styles.compactArrow}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardIcon}>🔒</Text>
      <Text style={styles.cardTitle}>{meta.name}-д нээгдэнэ</Text>
      <Text style={styles.cardHint}>
        Энэ боломж дээд багцаар нээгдэнэ. Багцаа шинэчлээд идэвхжүүлнэ үү.
      </Text>
      <TouchableOpacity style={styles.cardBtn} onPress={onPress}>
        <Text style={styles.cardBtnText}>Багц харах</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  compactIcon: { fontSize: 16 },
  compactText: { flex: 1, fontSize: 13, color: AppColors.black, fontWeight: '600' },
  compactArrow: { fontSize: 20, color: AppColors.grayDark },
  card: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  cardIcon: { fontSize: 32 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.black,
    marginTop: 6,
  },
  cardHint: {
    fontSize: 12,
    color: AppColors.grayDark,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  cardBtn: {
    marginTop: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cardBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
});
