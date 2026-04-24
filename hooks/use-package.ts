import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canAccess,
  PACKAGES,
  type FeatureKey,
  type PackageId,
} from '@/services/pricing';

const PACKAGE_KEY = '@malchin_package';

// Package state nь одоогоор зөвхөн local storage — real billing хийгээгүй.
// Backend ирэхэд GET /me/package-р шинэчлэнэ.
export function usePackage() {
  const [pkg, setPkg] = useState<PackageId>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PACKAGE_KEY)
      .then((raw) => {
        if (raw && raw in PACKAGES) {
          setPkg(raw as PackageId);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updatePackage = useCallback(async (next: PackageId) => {
    setPkg(next);
    await AsyncStorage.setItem(PACKAGE_KEY, next);
  }, []);

  const has = useCallback(
    (feature: FeatureKey) => canAccess(pkg, feature),
    [pkg]
  );

  return { pkg, loading, updatePackage, has };
}
