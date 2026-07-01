import { api, ApiError } from './api';
import { secureStorage, SecureKeys } from './secureStorage';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  avatarUrl: string | null;
  about: string;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  isNewUser: boolean;
}

// ── send OTP ──────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<{ success: boolean; expiresIn: number }> {
  return api.post('/api/auth/send-otp', { phone }, { skipAuth: true });
}

// ── verify OTP ────────────────────────────────────────────────────────────────

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
  const result = await api.post<VerifyOtpResult>(
    '/api/auth/verify-otp',
    { phone, otp },
    { skipAuth: true },
  );

  // Persist tokens immediately so the api wrapper can use them
  await secureStorage.set(SecureKeys.AUTH_TOKEN, result.accessToken);
  await secureStorage.set(SecureKeys.REFRESH_TOKEN, result.refreshToken);

  return result;
}

// ── complete profile ──────────────────────────────────────────────────────────

export async function completeProfile(name: string, about?: string): Promise<{ user: AuthUser }> {
  return api.post('/api/auth/complete-profile', { name, about });
}

// ── logout ────────────────────────────────────────────────────────────────────

export async function logoutRemote(): Promise<void> {
  try {
    await api.post('/api/auth/logout', {});
  } catch (err) {
    // Best-effort — clear tokens locally regardless
    if (!(err instanceof ApiError)) throw err;
  } finally {
    await secureStorage.delete(SecureKeys.AUTH_TOKEN);
    await secureStorage.delete(SecureKeys.REFRESH_TOKEN);
  }
}
