import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skillId = searchParams.get("skillId");

    const where = skillId
      ? { skillId, userId: session.user.id }
      : { userId: session.user.id };

    const [logs, total] = await Promise.all([
      prisma.requestLog.findMany({
        where,
        include: {
          apiKey: {
            select: {
              keyBody: true,
              prefix: true,
            },
          },
          skill: {
            select: {
              name: true,
              customSlug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.requestLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
