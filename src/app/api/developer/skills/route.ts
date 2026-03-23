import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all skills for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { apiKeys: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Get skills error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// POST - Create a new skill
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { name, description, targetUrl, customSlug } = await req.json();

    if (!name || !targetUrl || !customSlug) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(customSlug)) {
      return NextResponse.json(
        { error: "Slug 只能包含小写字母、数字和连字符" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existing = await prisma.skill.findUnique({
      where: { customSlug },
    });

    if (existing) {
      return NextResponse.json({ error: "该 Slug 已被占用" }, { status: 409 });
    }

    const skill = await prisma.skill.create({
      data: {
        userId: session.user.id,
        name,
        description,
        targetUrl,
        customSlug,
      },
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Create skill error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
