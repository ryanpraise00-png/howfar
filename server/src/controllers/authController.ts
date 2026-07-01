import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { generateOtp, formatPhone } from '../utils/index';
import * as smsService from '../services/smsService';
import { blacklistToken } from '../middleware/auth';

// ── Redis key helpers ─────────────────────────────────────────────────────────

const OTP_KEY         = (phone: string) => `otp:${phone}`;
const OTP_ATTEMPTS    = (phone: string) => `otp_attempts:${phone}`;
const OTP_RATE        = (phone: string) => `otp_rate:${phone}`;
const REFRESH_KEY     = (userId: string) => `refresh:${userId}`;

const OTP_TTL         = parseInt(process.env.OTP_EXPIRY_SECONDS ?? '300', 10);
const RATE_WINDOW     = 600;   // 10 minutes
const MAX_RATE        = 3;     // max OTPs per window
const MAX_ATTEMPTS    = 5;     // wrong guesses before lockout
const LOCKOUT_TTL     = 1800;  // 30 minutes
const REFRESH_TTL_S   = 60 * 60 * 24 * 30; // 30 days in seconds

// ── sendOtp ──────────────────────────────────────────────────────────────────

export async function sendOtp(app: FastifyInstance, rawPhone: string) {
  const phone = formatPhone(rawPhone);

  // Rate limit: max 3 OTPs per phone per 10 min
  const rateKey = OTP_RATE(phone);
  const count   = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, RATE_WINDOW);
  if (count > MAX_RATE) {
    const ttl = await redis.ttl(rateKey);
    throw { statusCode: 429, message: `Too many attempts. Try again in ${Math.ceil(ttl / 60)} minutes.` };
  }

  const otp = generateOtp(6);
  await redis.set(OTP_KEY(phone), otp, 'EX', OTP_TTL);
  await redis.del(OTP_ATTEMPTS(phone)); // reset attempt counter on new OTP

  const sms = await smsService.sendOtp(phone, otp);
  if (!sms.ok) {
    // Roll back the stored OTP so a retry re-generates a fresh one
    await redis.del(OTP_KEY(phone));
    throw {
      statusCode: sms.code === 'SMS_DELIVERY_FAILED' ? 503 : 500,
      code: sms.code,
      message: sms.message,
    };
  }

  return { success: true, expiresIn: OTP_TTL };
}

// ── verifyOtp ─────────────────────────────────────────────────────────────────

export async function verifyOtp(app: FastifyInstance, rawPhone: string, otp: string) {
  const phone       = formatPhone(rawPhone);
  const attemptsKey = OTP_ATTEMPTS(phone);

  // Check lockout
  const attempts = parseInt((await redis.get(attemptsKey)) ?? '0', 10);
  if (attempts >= MAX_ATTEMPTS) {
    const ttl = await redis.ttl(attemptsKey);
    throw { statusCode: 429, message: `Too many incorrect attempts. Try again in ${Math.ceil(ttl / 60)} minutes.` };
  }

  const stored = await redis.get(OTP_KEY(phone));
  if (!stored) {
    throw { statusCode: 400, message: 'OTP expired or invalid' };
  }

  if (stored !== otp.trim()) {
    const newCount = await redis.incr(attemptsKey);
    if (newCount === 1) await redis.expire(attemptsKey, LOCKOUT_TTL);
    const remaining = MAX_ATTEMPTS - newCount;
    throw {
      statusCode: 400,
      message: remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : 'Too many incorrect attempts. Account locked for 30 minutes.',
    };
  }

  // Valid — clean up
  await redis.del(OTP_KEY(phone));
  await redis.del(OTP_ATTEMPTS(phone));

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user || !user.name;

  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: '', lastSeen: new Date() },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });
  }

  const { accessToken, refreshToken } = await issueTokens(app, user.id, user.phone);

  return {
    accessToken,
    refreshToken,
    user: pick(user, ['id', 'phone', 'name', 'avatarUrl', 'about']),
    isNewUser,
  };
}

// ── refresh ───────────────────────────────────────────────────────────────────

export async function refreshTokens(app: FastifyInstance, token: string) {
  let payload: { sub: string; phone: string };
  try {
    payload = app.jwt.verify<{ sub: string; phone: string }>(token);
  } catch {
    throw { statusCode: 401, message: 'Invalid refresh token' };
  }

  const stored = await redis.get(REFRESH_KEY(payload.sub));
  if (!stored || stored !== token) {
    throw { statusCode: 401, message: 'Refresh token revoked or not found' };
  }

  const { accessToken, refreshToken } = await issueTokens(app, payload.sub, payload.phone);
  return { accessToken, refreshToken };
}

// ── logout ────────────────────────────────────────────────────────────────────

export async function logout(userId: string, accessJti?: string, accessExp?: number) {
  // Blacklist the current access token so it can't be reused until it naturally expires
  if (accessJti && accessExp) {
    await blacklistToken(accessJti, accessExp);
  }
  // Invalidate refresh token — next refresh attempt will fail
  await redis.del(REFRESH_KEY(userId));
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false, lastSeen: new Date() },
  });
  return { success: true };
}

// ── completeProfile ───────────────────────────────────────────────────────────

export async function completeProfile(userId: string, name: string, about?: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      ...(about !== undefined ? { about: about.trim() } : {}),
    },
  });
  return pick(user, ['id', 'phone', 'name', 'avatarUrl', 'about']);
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function issueTokens(app: FastifyInstance, userId: string, phone: string) {
  const accessJti  = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  // Access token: 15-minute lifetime + jti for blacklisting on logout
  const accessToken = app.jwt.sign(
    { sub: userId, phone, jti: accessJti },
    { expiresIn: '15m' }
  );
  // Refresh token: 30-day lifetime; rotated on every use (old token overwritten in Redis)
  const refreshToken = app.jwt.sign(
    { sub: userId, phone, jti: refreshJti },
    { expiresIn: '30d' }
  );

  await redis.set(REFRESH_KEY(userId), refreshToken, 'EX', REFRESH_TTL_S);
  return { accessToken, refreshToken };
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Pick<T, K>);
}
