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

export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  // 1. Check if key is provided
  if (!apiKey) {
    return {
      valid: false,
      error: "Missing API Key",
      errorCode: 401,
    };
  }

  // Try to get from cache first
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
      return {
        valid: false,
        error: "Invalid API Key",
        errorCode: 403,
      };
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

    // Cache for 5 minutes
    await cacheSet(cacheKey, keyData, 300);
  }

  // 2. Check key status
  if (keyData.status !== "ACTIVE") {
    return {
      valid: false,
      error: `Key ${keyData.status.toLowerCase()}`,
      errorCode: 403,
    };
  }

  // 3. Check key expiration
  if (keyData.expireAt) {
    const expireTime = new Date(keyData.expireAt);
    if (new Date() > expireTime) {
      // Mark as expired in DB
      await prisma.apiKey.update({
        where: { id: keyData.id },
        data: { status: "EXPIRED" },
      });
      await cacheDel(cacheKey);
      return {
        valid: false,
        error: "Key Expired",
        errorCode: 403,
      };
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
        return {
          valid: false,
          error: "Developer Membership Expired",
          errorCode: 403,
        };
      }
    }
  }

  // 5. Check quota
  if (keyData.totalQuota > 0 && keyData.usedQuota >= keyData.totalQuota) {
    return {
      valid: false,
      error: "Quota Exceeded",
      errorCode: 403,
    };
  }

  return {
    valid: true,
    apiKey: keyData,
  };
}

export async function incrementUsage(apiKeyId: string): Promise<void> {
  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        usedQuota: {
          increment: 1,
        },
      },
    });
    // Invalidate cache
    const dbKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { keyBody: true },
    });
    if (dbKey) {
      await cacheDel(`apikey:${dbKey.keyBody}`);
    }
  } catch (error) {
    console.error("Failed to increment usage:", error);
  }
}
