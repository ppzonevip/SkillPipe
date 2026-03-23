import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateKey(prefix: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  for (let i = 0; i < 16; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pm-${prefix}-${randomPart}`;
}

function calculateExpireAt(days: number): Date | null {
  if (days === -1) return null; // Permanent
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// POST - Generate new API keys
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { skillId, prefix, expireDays, totalQuota, count } = await req.json();

    if (!skillId || !prefix) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (count < 1 || count > 100) {
      return NextResponse.json({ error: "生成数量需在 1-100 之间" }, { status: 400 });
    }

    // Validate prefix (alphanumeric and hyphens only, must start with letter)
    if (!/^[a-z][a-z0-9-]*$/.test(prefix)) {
      return NextResponse.json(
        { error: "前缀只能包含小写字母、数字和连字符，且必须以字母开头" },
        { status: 400 }
      );
    }

    // Check skill ownership
    const skill = await prisma.skill.findFirst({
      where: { id: skillId, userId: session.user.id },
    });

    if (!skill) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const expireAt = calculateExpireAt(expireDays || 30);
    const keys: Array<{ keyBody: string; expireAt: Date | null }> = [];

    // Generate keys
    for (let i = 0; i < count; i++) {
      let keyBody = generateKey(prefix);

      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.apiKey.findUnique({
          where: { keyBody },
        });
        if (!existing) break;
        keyBody = generateKey(prefix);
        attempts++;
      }

      keys.push({ keyBody, expireAt });
    }

    // Insert all keys
    const createdKeys = await prisma.apiKey.createMany({
      data: keys.map((k) => ({
        skillId,
        userId: session.user.id,
        keyBody: k.keyBody,
        prefix: `pm-${prefix}`,
        status: "ACTIVE",
        expireAt: k.expireAt,
        totalQuota: totalQuota || 0,
        usedQuota: 0,
      })),
    });

    // Return the generated keys
    const keysWithMeta = await prisma.apiKey.findMany({
      where: {
        skillId,
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: count,
      select: {
        id: true,
        keyBody: true,
        prefix: true,
        status: true,
        expireAt: true,
        totalQuota: true,
        usedQuota: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      count: createdKeys.count,
      keys: keysWithMeta,
    });
  } catch (error) {
    console.error("Generate keys error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
