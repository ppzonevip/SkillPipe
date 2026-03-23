import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skillId = searchParams.get("skillId");

    const where = skillId
      ? { skillId, userId: session.id }
      : { userId: session.id };

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
