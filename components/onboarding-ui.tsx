import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

export function StepHeader({
  step,
  total,
  title,
  subtitle,
  onBack,
  showBack = true,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };
  return (
    <View style={styles.headerWrap}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressWrap}>
          <ProgressBar current={step} total={total} />
        </View>
        <Text style={styles.stepCounter}>{step}/{total}</Text>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, (disabled || loading) && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={AppColors.white} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.secondaryBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: 6,
    backgroundColor: AppColors.grayMedium,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.black,
    lineHeight: 24,
  },
  progressWrap: { flex: 1 },
  stepCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.grayDark,
    minWidth: 32,
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.black,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: AppColors.grayDark,
    marginTop: 6,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryBtnText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.5 },
});
