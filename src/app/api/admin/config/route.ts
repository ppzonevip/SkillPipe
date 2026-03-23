import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all system configs
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const configs = await prisma.systemConfig.findMany();

    const configMap: Record<string, string> = {};
    configs.forEach((c) => {
      configMap[c.key] = c.value;
    });

    return NextResponse.json(configMap);
  } catch (error) {
    console.error("Get config error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// PUT - Update system config
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "缺少配置键" }, { status: 400 });
    }

    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
