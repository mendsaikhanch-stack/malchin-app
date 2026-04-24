import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  refreshAccessToken,
  __resetTokenCacheForTests,
} from '../auth-token';

const ACCESS_KEY = '@malchin_token';
const REFRESH_KEY = '@malchin_refresh_token';

beforeEach(async () => {
  __resetTokenCacheForTests();
  await AsyncStorage.clear();
});

describe('auth-token — setTokens / getAccessToken / getRefreshToken', () => {
  it('setTokens access only-г хадгалж буцааж уншина', async () => {
    await setTokens({ access: 'A1' });
    expect(await getAccessToken()).toBe('A1');
  });

  it('setTokens access + refresh хоёуланг хадгалж буцааж уншина', async () => {
    await setTokens({ access: 'A2', refresh: 'R2' });
    expect(await getAccessToken()).toBe('A2');
    expect(await getRefreshToken()).toBe('R2');
  });

  it('access null болгоход AsyncStorage-аас устгана', async () => {
    await AsyncStorage.setItem(ACCESS_KEY, 'pre');
    __resetTokenCacheForTests();
    await setTokens({ access: null });
    expect(await AsyncStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(await getAccessToken()).toBeNull();
  });

  it('refresh undefined үед refresh утга хэвээр үлдэнэ', async () => {
    await setTokens({ access: 'A', refresh: 'R' });
    await setTokens({ access: 'A2' }); // refresh: undefined — хөдөлгөхгүй
    expect(await getRefreshToken()).toBe('R');
  });

  it('cold start: AsyncStorage дахь утга get-ээр уншигдана', async () => {
    await AsyncStorage.setItem(ACCESS_KEY, 'X1');
    __resetTokenCacheForTests();
    expect(await getAccessToken()).toBe('X1');
    // Дараагийн дуудалт ижил утгаар буцана (cache-ээс)
    expect(await getAccessToken()).toBe('X1');
  });
});

describe('auth-token — clearTokens', () => {
  it('хоёр key + in-memory cache цэвэрлэнэ', async () => {
    await setTokens({ access: 'A', refresh: 'R' });
    await clearTokens();
    expect(await AsyncStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});

describe('auth-token — refreshAccessToken', () => {
  const API = 'https://api.test';

  it('refresh token байхгүй бол null буцаана (fetch огт хийхгүй)', async () => {
    const fetchImpl = jest.fn();
    const result = await refreshAccessToken(API, fetchImpl as any);
    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('амжилттай refresh → шинэ access + хуучин refresh хадгалагдана', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'NEW' }),
    });
    const result = await refreshAccessToken(API, fetchImpl as any);
    expect(result).toBe('NEW');
    expect(await getAccessToken()).toBe('NEW');
    // refresh үлдэнэ — backend response-д refreshToken байсангүй
    expect(await getRefreshToken()).toBe('R1');
  });

  it('амжилттай refresh + шинэ refreshToken ирэх үед rotate хийгдэнэ', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'NEW', refreshToken: 'R2' }),
    });
    await refreshAccessToken(API, fetchImpl as any);
    expect(await getRefreshToken()).toBe('R2');
  });

  it('backend 401 буцаавал null, токэнуудыг өөрчлөхгүй', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    const result = await refreshAccessToken(API, fetchImpl as any);
    expect(result).toBeNull();
    expect(await getAccessToken()).toBe('OLD');
    expect(await getRefreshToken()).toBe('R1');
  });

  it('backend response-д token байхгүй бол null', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const result = await refreshAccessToken(API, fetchImpl as any);
    expect(result).toBeNull();
    expect(await getAccessToken()).toBe('OLD');
  });

  it('fetch throw хийсэн үед алдаа catch хийнэ, null буцаана', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network down'));
    const result = await refreshAccessToken(API, fetchImpl as any);
    expect(result).toBeNull();
    expect(await getAccessToken()).toBe('OLD');
  });

  it('concurrent refresh call 2 удаа дуудахад нэг л fetch хийнэ', async () => {
    await setTokens({ access: 'OLD', refresh: 'R1' });
    let resolveFetch: (v: any) => void;
    const fetchPromise = new Promise((r) => { resolveFetch = r; });
    const fetchImpl = jest.fn().mockReturnValue(fetchPromise);

    const p1 = refreshAccessToken(API, fetchImpl as any);
    const p2 = refreshAccessToken(API, fetchImpl as any);

    resolveFetch!({ ok: true, json: async () => ({ token: 'NEW' }) });
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe('NEW');
    expect(r2).toBe('NEW');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
