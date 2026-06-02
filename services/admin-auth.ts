// Owner / Admin web dashboard-ийн нэвтрэлтийн token helper.
//
// Phase 1 (одоогийн): Constant passcode. Local-д token хадгална.
//   - Default passcode: 'malchin-admin-2026' (env-р override хийнэ).
//   - Token: opaque random string (`admin:` prefix + timestamp + random).
// Phase 2 (backend бэлэн болоход): POST /admin/login → JWT.
//   `verifyAdminPasscode` нь backend дуудлагатай болно. Storage layer
//   өөрчлөгдөхгүй.
//
// User-facing auth (utlas + OTP) нь `auth-token.ts`-д тусдаа — энд
// зөвхөн web admin scope.

import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_TOKEN_KEY = '@malchin_admin_token';

// Expo public env var-аар override хийж болно.
// Production-д бодит passcode env-ээр инжектэр хийгдэх ёстой.
const DEFAULT_PASSCODE = 'malchin-admin-2026';
const PASSCODE =
  // process.env нь web bundle-д литералаар орлдог
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ADMIN_PASSCODE) ||
  DEFAULT_PASSCODE;

export type AdminVerifyResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'passcode' };

export async function getAdminToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAdminToken(token: string): Promise<void> {
  await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export async function clearAdminToken(): Promise<void> {
  await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Token format-ийг гадна газраас тэнцүүлж шалгахад туслана (Phase 2-д
// JWT structure check эсвэл backend verify дуудна).
export function isValidTokenFormat(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('admin:') && token.length > 'admin:'.length + 8;
}

// Phase 1 passcode verify. Phase 2-д server-side check-ээр солигдоно.
export async function verifyAdminPasscode(
  passcode: string
): Promise<AdminVerifyResult> {
  if (passcode !== PASSCODE) {
    return { ok: false, reason: 'passcode' };
  }
  // Token: `admin:<timestamp>:<random>` — Phase 2-д JWT-ээр солих.
  const random = Math.random().toString(36).slice(2, 10);
  const token = `admin:${Date.now()}:${random}`;
  return { ok: true, token };
}

// Test helper — passcode-ыг шалгахад harm-гүй export
export function getConfiguredPasscodeForTest(): string {
  return PASSCODE;
}
