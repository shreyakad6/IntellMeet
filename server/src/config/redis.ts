import { config } from './env.js';

interface ICacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  isAvailable(): boolean;
}

// In-Memory Fallback Cache Store
class MemoryCacheStore implements ICacheStore {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  isAvailable(): boolean {
    return true;
  }
}

let cacheClient: ICacheStore = new MemoryCacheStore();
let redisConnected = false;

export const initRedis = async (): Promise<void> => {
  if (!config.REDIS_ENABLED) {
    console.log('[Cache] Redis is disabled in configuration. Using in-memory fallback cache.');
    return;
  }

  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: config.REDIS_URL });

    client.on('error', (err) => {
      console.warn('[Cache] Redis connection error, fallback to memory cache active:', err.message);
      redisConnected = false;
    });

    client.on('connect', () => {
      console.log('[Cache] Redis connected successfully.');
      redisConnected = true;
    });

    await client.connect();

    cacheClient = {
      async get(key: string): Promise<string | null> {
        return client.get(key);
      },
      async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
          await client.set(key, value, { EX: ttlSeconds });
        } else {
          await client.set(key, value);
        }
      },
      async del(key: string): Promise<void> {
        await client.del(key);
      },
      isAvailable(): boolean {
        return redisConnected;
      }
    };
  } catch (error: any) {
    console.warn(`[Cache] Could not initialize Redis client (${error?.message}). Operating with in-memory cache.`);
    cacheClient = new MemoryCacheStore();
  }
};

export const getCache = (): ICacheStore => cacheClient;
export const isRedisActive = (): boolean => redisConnected;
