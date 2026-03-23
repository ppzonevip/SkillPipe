import { prisma } from "./prisma";
import { cacheGet, cacheSet, cacheDel } from "./redis";

interface ApiKeyCache {
  id: string;
  keyBody: string;
  status: string;
  expireAt: string | null;
  totalQuota: number;
  usedQuota: number;
  skillId: string;
  skillTargetUrl: string;
  skillCustomSlug: string;
  userId: string;
  userMembershipTier: number;
  userMembershipExpireAt: string | null;
  userRole: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: number;
  apiKey?: ApiKeyCache;
}

// In-memory cache for validation results (short TTL for high-frequency checks)
const validationCache = new Map<string, { result: ValidationResult; timestamp: number }>();
const VALIDATION_CACHE_TTL = 5000; // 5 seconds

export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  // 1. Check if key is provided
  if (!apiKey) {
    return {
      valid: false,
      error: "Missing API Key",
      errorCode: 401,
    };
  }

  // Check in-memory validation cache first (avoid repeated validation within short time)
  const cached = validationCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < VALIDATION_CACHE_TTL) {
    return cached.result;
  }

  // Try to get from Redis cache first
  const cacheKey = `apikey:${apiKey}`;
  let keyData: ApiKeyCache | null = await cacheGet(cacheKey);

  // If not in cache, get from DB
  if (!keyData) {
    const dbKey = await prisma.apiKey.findUnique({
      where: { keyBody: apiKey },
      include: {
        skill: {
          select: {
            id: true,
            targetUrl: true,
            customSlug: true,
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            membershipTier: true,
            membershipExpireAt: true,
            role: true,
          },
        },
      },
    });

    if (!dbKey) {
      const result = {
        valid: false,
        error: "Invalid API Key",
        errorCode: 403,
      };
      validationCache.set(apiKey, { result, timestamp: Date.now() });
      return result;
    }

    // Build cache object
    keyData = {
      id: dbKey.id,
      keyBody: dbKey.keyBody,
      status: dbKey.status,
      expireAt: dbKey.expireAt?.toISOString() || null,
      totalQuota: dbKey.totalQuota,
      usedQuota: dbKey.usedQuota,
      skillId: dbKey.skill.id,
      skillTargetUrl: dbKey.skill.targetUrl,
      skillCustomSlug: dbKey.skill.customSlug,
      userId: dbKey.user.id,
      userMembershipTier: dbKey.user.membershipTier,
      userMembershipExpireAt: dbKey.user.membershipExpireAt?.toISOString() || null,
      userRole: dbKey.user.role,
    };

    // Cache in Redis for 5 minutes
    await cacheSet(cacheKey, keyData, 300);
  }

  // 2. Check key status
  if (keyData.status !== "ACTIVE") {
    const result = {
      valid: false,
      error: `Key ${keyData.status.toLowerCase()}`,
      errorCode: 403,
    };
    validationCache.set(apiKey, { result, timestamp: Date.now() });
    return result;
  }

  // 3. Check key expiration
  if (keyData.expireAt) {
    const expireTime = new Date(keyData.expireAt);
    if (new Date() > expireTime) {
      // Mark as expired in DB (non-blocking)
      prisma.apiKey.update({
        where: { id: keyData.id },
        data: { status: "EXPIRED" },
      }).catch(console.error);
      await cacheDel(cacheKey);
      const result = {
        valid: false,
        error: "Key Expired",
        errorCode: 403,
      };
      validationCache.set(apiKey, { result, timestamp: Date.now() });
      return result;
    }
  }

  // 4. Check developer's membership status
  if (keyData.userMembershipExpireAt) {
    const expireTime = new Date(keyData.userMembershipExpireAt);
    if (new Date() > expireTime && keyData.userRole !== "ADMIN") {
      // Check if lock on expire is enabled
      const lockConfig = await prisma.systemConfig.findUnique({
        where: { key: "member_lock_on_expire" },
      });
      if (lockConfig?.value === "true") {
        const result = {
          valid: false,
          error: "Developer Membership Expired",
          errorCode: 403,
        };
        validationCache.set(apiKey, { result, timestamp: Date.now() });
        return result;
      }
    }
  }

  // 5. Check quota
  if (keyData.totalQuota > 0 && keyData.usedQuota >= keyData.totalQuota) {
    const result = {
      valid: false,
      error: "Quota Exceeded",
      errorCode: 403,
    };
    validationCache.set(apiKey, { result, timestamp: Date.now() });
    return result;
  }

  const result = {
    valid: true,
    apiKey: keyData,
  };
  validationCache.set(apiKey, { result, timestamp: Date.now() });
  return result;
}

// Non-blocking usage increment
export function incrementUsage(apiKeyId: string): void {
  // Fire and forget - don't await
  prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      usedQuota: {
        increment: 1,
      },
    },
  }).catch((error) => {
    console.error("Failed to increment usage:", error);
  });

  // Invalidate cache in background
  prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { keyBody: true },
  }).then(async (dbKey) => {
    if (dbKey) {
      await cacheDel(`apikey:${dbKey.keyBody}`);
      validationCache.delete(dbKey.keyBody);
    }
  }).catch(console.error);
}

// Non-blocking log writing
export function writeRequestLog(data: {
  apiKeyId: string;
  skillId: string;
  userId: string;
  method: string;
  path: string;
  statusCode: number;
  errorMsg?: string;
  duration: number;
  ip?: string;
}): void {
  // Fire and forget - don't await
  prisma.requestLog.create({
    data,
  }).catch((error) => {
    console.error("Failed to write request log:", error);
  });
}
