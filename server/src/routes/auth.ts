import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/authController';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const E164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +2348012345678)');

const sendOtpBody   = z.object({ phone: E164 }).strict();
const verifyOtpBody = z.object({ phone: E164, otp: z.string().length(6, 'OTP must be 6 digits') }).strict();
const refreshBody   = z.object({ refreshToken: z.string().min(10) }).strict();
const profileBody   = z.object({ name: z.string().min(1).max(50), about: z.string().max(139).optional() }).strict();

// ── helper: parse body with Zod ───────────────────────────────────────────────

function parse<T>(schema: z.ZodType<T>, data: unknown, reply: any): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Validation error' } });
    return null;
  }
  return result.data;
}

// ── route registration ────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {

  // Stricter per-IP limit on OTP send: 20 per hour
  const otpRateLimit = {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
        keyGenerator: (req: any) => `otp_ip:${req.ip}`,
        errorResponseBuilder: () => ({
          error: { code: 'RATE_LIMITED', message: 'Too many OTP requests from this IP. Try again in 1 hour.' },
        }),
      },
    },
  };

  // POST /auth/send-otp
  app.post('/send-otp', otpRateLimit, async (request, reply) => {
    const body = parse(sendOtpBody, request.body, reply);
    if (!body) return;
    try {
      const result = await ctrl.sendOtp(app, body.phone);
      return reply.send(result);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({
        error: { code: err.code ?? 'SEND_OTP_ERROR', message: err.message },
      });
    }
  });

  // POST /auth/verify-otp
  app.post('/verify-otp', otpRateLimit, async (request, reply) => {
    const body = parse(verifyOtpBody, request.body, reply);
    if (!body) return;
    try {
      const result = await ctrl.verifyOtp(app, body.phone, body.otp);
      return reply.send(result);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'VERIFY_OTP_ERROR', message: err.message } });
    }
  });

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const body = parse(refreshBody, request.body, reply);
    if (!body) return;
    try {
      const result = await ctrl.refreshTokens(app, body.refreshToken);
      return reply.send(result);
    } catch (err: any) {
      reply.status(err.statusCode ?? 500).send({ error: { code: 'REFRESH_ERROR', message: err.message } });
    }
  });

  // POST /auth/logout  (requires auth)
  app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const user = request.user as { sub: string; jti?: string; exp?: number };
      const result = await ctrl.logout(user.sub, user.jti, user.exp);
      return reply.send(result);
    } catch (err: any) {
      reply.status(500).send({ error: { code: 'LOGOUT_ERROR', message: err.message } });
    }
  });

  // POST /auth/complete-profile  (requires auth)
  app.post('/complete-profile', { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(profileBody, request.body, reply);
    if (!body) return;
    try {
      const user = await ctrl.completeProfile(request.user.sub, body.name, body.about);
      return reply.send({ user });
    } catch (err: any) {
      reply.status(500).send({ error: { code: 'PROFILE_ERROR', message: err.message } });
    }
  });
}
