import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePackage } from './use-package';
import {
  countThisMonth,
  evaluateQuota,
  hasUnlimitedVariant,
  QUOTA_LIMITS,
  type QuotaStatus,
} from '@/services/quota';
import type { FeatureKey } from '@/services/pricing';

const QUOTA_PREFIX = '@malchin_quota_';

// Feature-тусгай timestamp жагсаалт AsyncStorage-д хадгалах wrapper.
// 'month' period-тай feature-д тохирно. 'active' period нь caller-аас
// бодит "active count" хүлээж авна (жишээ: open listings тоо).
export function useQuota(feature: FeatureKey, activeOverride?: number) {
  const { pkg, loading: pkgLoading } = usePackage();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const cfg = QUOTA_LIMITS[feature];
  const storageKey = QUOTA_PREFIX + feature;

  // AsyncStorage-аас load
  useEffect(() => {
    if (!cfg) {
      setLoading(false);
      return;
    }
    if (cfg.period === 'active') {
      setUsed(activeOverride ?? 0);
      setLoading(false);
      return;
    }
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!raw) {
          setUsed(0);
          return;
        }
        try {
          const ts = JSON.parse(raw) as number[];
          setUsed(countThisMonth(ts));
        } catch {
          setUsed(0);
        }
      })
      .finally(() => setLoading(false));
  }, [cfg, storageKey, activeOverride]);

  // Шинэ ашиглалтыг бүртгэх (month period only).
  const record = useCallback(async () => {
    if (!cfg || cfg.period !== 'month') return;
    const raw = await AsyncStorage.getItem(storageKey);
    let list: number[] = [];
    try {
      list = raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      list = [];
    }
    list.push(Date.now());
    await AsyncStorage.setItem(storageKey, JSON.stringify(list));
    setUsed(countThisMonth(list));
  }, [cfg, storageKey]);

  const unlimited = hasUnlimitedVariant(feature, pkg);
  const status: QuotaStatus = evaluateQuota(feature, used, unlimited);

  return {
    ...status,
    loading: loading || pkgLoading,
    record,
  };
}
