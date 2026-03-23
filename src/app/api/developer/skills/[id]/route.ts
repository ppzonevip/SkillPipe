import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single skill
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const skill = await prisma.skill.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        apiKeys: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!skill) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Get skill error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// PUT - Update skill
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, targetUrl, isActive } = await req.json();

    // Check ownership
    const existing = await prisma.skill.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name,
        description,
        targetUrl,
        isActive,
      },
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Update skill error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE - Delete skill
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.skill.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // Delete skill (cascade will handle apiKeys)
    await prisma.skill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete skill error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
