import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  // Upstash and other TLS Redis hosts use rediss:// — enable TLS when detected
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redis.on('connect', () => console.log('[Redis] connected'));
redis.on('error', (err) => console.error('[Redis] error:', err.message));

export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
