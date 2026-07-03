import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chats';
import { userRoutes } from './routes/users';
import { mediaRoutes } from './routes/media';
import { statusRoutes } from './routes/status';
import { xenRoutes } from './routes/xen';

const isProd = process.env.NODE_ENV === 'production';

// Allowed CORS origins — production locks to explicit domain; dev allows all
function buildCorsOrigin(): string[] | true {
  if (!isProd) return true as any;
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length ? origins : ['https://howfar.app'];
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: isProd ? 'warn' : 'info',
      transport: !isProd
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    // Attach request id to every log entry automatically
    genReqId: () => randomUUID(),
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: buildCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  });

  await app.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB ceiling; per-route can tighten
  });

  // ── Global rate limiting (100 req / 60 s per IP) ─────────────────────────────
  // Pass Redis for distributed rate limiting; fall back to in-memory if Redis
  // isn't available so a cold Redis connection never crashes the boot sequence.
  let rateLimitRedis: typeof redis | undefined;
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') rateLimitRedis = redis;
  } catch {
    app.log.warn('Redis unavailable at startup — rate limiting will use in-memory store');
  }

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    ...(rateLimitRedis ? { redis: rateLimitRedis } : {}),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Retry after ${Math.ceil(context.ttl / 1000)}s`,
      },
    }),
  });

  // ── Error handler ─────────────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Routes ───────────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(authRoutes,   { prefix: '/api/auth' });
  await app.register(chatRoutes,   { prefix: '/api/chats' });
  await app.register(userRoutes,   { prefix: '/api/users' });
  await app.register(mediaRoutes,  { prefix: '/api/media' });
  await app.register(statusRoutes, { prefix: '/api/status' });
  await app.register(xenRoutes,    { prefix: '/xen' });

  return app;
}
