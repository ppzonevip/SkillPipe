import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL not configured, Redis caching disabled");
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    client.on("connect", () => {
      console.log("Redis connected");
    });

    return client;
  } catch (error) {
    console.error("Failed to create Redis client:", error);
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// Key cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  expireSeconds = 300
): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, expireSeconds, JSON.stringify(value));
  } catch (error) {
    console.error("Redis cache set error:", error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis cache del error:", error);
  }
}
