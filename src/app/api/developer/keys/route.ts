import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all API keys for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      include: {
        skill: {
          select: {
            name: true,
            customSlug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Get keys error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// DELETE - Delete an API key
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少 Key ID" }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.apiKey.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Key 不存在" }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete key error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
