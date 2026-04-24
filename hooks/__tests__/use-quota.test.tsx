import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuota } from '../use-quota';

const ADVISORY_KEY = '@malchin_quota_advisory_limited';
const PACKAGE_KEY = '@malchin_package';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('useQuota / advisory (month period)', () => {
  it('default (free, 0 used) → allowed=true, limit=3, remaining=3', async () => {
    const { result } = renderHook(() => useQuota('advisory_limited'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allowed).toBe(true);
    expect(result.current.limit).toBe(3);
    expect(result.current.remaining).toBe(3);
    expect(result.current.unlimited).toBe(false);
  });

  it('storage-д 3 timestamp байвал used=3, allowed=false', async () => {
    const now = Date.now();
    await AsyncStorage.setItem(
      ADVISORY_KEY,
      JSON.stringify([now - 1000, now - 500, now - 100])
    );
    const { result } = renderHook(() => useQuota('advisory_limited'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.used).toBe(3);
    expect(result.current.allowed).toBe(false);
  });

  it('record() дуудахад used 1-ээр нэмэгдэнэ', async () => {
    const { result } = renderHook(() => useQuota('advisory_limited'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.used).toBe(0);

    await act(async () => {
      await result.current.record();
    });
    expect(result.current.used).toBe(1);
    expect(result.current.remaining).toBe(2);
  });

  it('premium_malchin багц → unlimited=true, ямар ч used-д allowed', async () => {
    await AsyncStorage.setItem(PACKAGE_KEY, 'premium_malchin');
    const now = Date.now();
    await AsyncStorage.setItem(
      ADVISORY_KEY,
      JSON.stringify([now, now, now, now, now]) // 5 used — far over free cap
    );
    const { result } = renderHook(() => useQuota('advisory_limited'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unlimited).toBe(true);
    expect(result.current.allowed).toBe(true);
    expect(result.current.remaining).toBe(Infinity);
  });

  it('өмнөх сарын timestamp нь тоологдохгүй', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    await AsyncStorage.setItem(
      ADVISORY_KEY,
      JSON.stringify([lastMonth.getTime(), lastMonth.getTime(), lastMonth.getTime()])
    );
    const { result } = renderHook(() => useQuota('advisory_limited'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.used).toBe(0);
    expect(result.current.allowed).toBe(true);
  });
});

describe('useQuota / listings (active period)', () => {
  it('activeOverride=0 → allowed, used=0', async () => {
    const { result } = renderHook(() =>
      useQuota('listings_create_basic', 0)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.used).toBe(0);
    expect(result.current.allowed).toBe(true);
    expect(result.current.limit).toBe(3);
  });

  it('activeOverride=3 → used=3, allowed=false', async () => {
    const { result } = renderHook(() =>
      useQuota('listings_create_basic', 3)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.used).toBe(3);
    expect(result.current.allowed).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it('premium_malchin → unlimited хэдэн ч active байсан ч allowed', async () => {
    await AsyncStorage.setItem(PACKAGE_KEY, 'premium_malchin');
    const { result } = renderHook(() =>
      useQuota('listings_create_basic', 10)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unlimited).toBe(true);
    expect(result.current.allowed).toBe(true);
  });

  it('record() active period-д no-op (storage unchanged)', async () => {
    const { result } = renderHook(() =>
      useQuota('listings_create_basic', 1)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.record();
    });
    const storageKey = '@malchin_quota_listings_create_basic';
    const stored = await AsyncStorage.getItem(storageKey);
    expect(stored).toBeNull();
  });
});
