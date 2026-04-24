import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `elder_contributor` profile capability (CLAUDE.md §3 locked 2026-04-24).
// Role биш — primary role (malchin, bag_darga, ...) хэвээрээ ч хамтдаа идэвхжинэ.
// Flag = true бол `/elder-content` draft→review→published pipeline нээгдэнэ.
const KEY = '@malchin_elder_contributor';

export function useElderFlag() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        setEnabled(raw === 'true');
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async (next: boolean) => {
    setEnabled(next);
    await AsyncStorage.setItem(KEY, String(next));
  }, []);

  return { enabled, loading, toggle };
}
