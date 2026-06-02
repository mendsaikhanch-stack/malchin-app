import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  isValidTokenFormat,
  verifyAdminPasscode,
  getConfiguredPasscodeForTest,
} from '../admin-auth';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('admin-auth / isValidTokenFormat', () => {
  it('null + хоосон → false', () => {
    expect(isValidTokenFormat(null)).toBe(false);
    expect(isValidTokenFormat(undefined)).toBe(false);
    expect(isValidTokenFormat('')).toBe(false);
  });

  it('"admin:" prefix биш → false', () => {
    expect(isValidTokenFormat('user:123:abc')).toBe(false);
    expect(isValidTokenFormat('123-456')).toBe(false);
  });

  it('"admin:" + дотор сонголт байгаа token → true', () => {
    expect(isValidTokenFormat('admin:1714000000000:xyz12345')).toBe(true);
  });

  it('"admin:" prefix-тэй боловч хэт богино → false', () => {
    expect(isValidTokenFormat('admin:1')).toBe(false);
  });
});

describe('admin-auth / verifyAdminPasscode', () => {
  it('тохирсон passcode → ok=true + token format зөв', async () => {
    const passcode = getConfiguredPasscodeForTest();
    const result = await verifyAdminPasscode(passcode);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isValidTokenFormat(result.token)).toBe(true);
    }
  });

  it('буруу passcode → ok=false + reason="passcode"', async () => {
    const result = await verifyAdminPasscode('wrong-code');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('passcode');
    }
  });

  it('хоосон string → ok=false', async () => {
    const result = await verifyAdminPasscode('');
    expect(result.ok).toBe(false);
  });

  it('Token нь дуудлага бүрд өвөрмөц (random suffix)', async () => {
    const passcode = getConfiguredPasscodeForTest();
    const r1 = await verifyAdminPasscode(passcode);
    const r2 = await verifyAdminPasscode(passcode);
    if (r1.ok && r2.ok) {
      expect(r1.token).not.toBe(r2.token);
    }
  });
});

describe('admin-auth / token storage', () => {
  it('эхлээд token байхгүй (хоосон storage)', async () => {
    expect(await getAdminToken()).toBeNull();
  });

  it('setAdminToken-ийн дараа уншигдана', async () => {
    await setAdminToken('admin:123:abc12345');
    expect(await getAdminToken()).toBe('admin:123:abc12345');
  });

  it('clearAdminToken → null', async () => {
    await setAdminToken('admin:123:abc12345');
    await clearAdminToken();
    expect(await getAdminToken()).toBeNull();
  });

  it('roundtrip: verify → set → get → clear', async () => {
    const passcode = getConfiguredPasscodeForTest();
    const result = await verifyAdminPasscode(passcode);
    if (!result.ok) throw new Error('expected ok');
    await setAdminToken(result.token);
    expect(await getAdminToken()).toBe(result.token);
    expect(isValidTokenFormat(await getAdminToken())).toBe(true);
    await clearAdminToken();
    expect(await getAdminToken()).toBeNull();
  });
});
