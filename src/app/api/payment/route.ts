import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateOrderNo(): string {
  return `SP${Date.now()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { tier, period } = await req.json();

    if (!tier || !period) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // Get tier config
    const tierConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_tiers" },
    });

    const tiers = tierConfig ? JSON.parse(tierConfig.value) : {
      tier1: { monthlyPrice: 29.9, yearlyPrice: 299 },
      tier2: { monthlyPrice: 99.9, yearlyPrice: 999 },
    };

    const tierKey = `tier${tier}`;
    const priceKey = period === "yearly" ? "yearlyPrice" : "monthlyPrice";
    const amount = tiers[tierKey]?.[priceKey] || 0;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.id,
        orderNo: generateOrderNo(),
        amount,
        tier,
        period,
        status: "PENDING",
      },
    });

    // Get payment configs
    const [alipayConfig, wxpayConfig, epayConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "alipay_app_id" } }),
      prisma.systemConfig.findUnique({ where: { key: "wxpay_app_id" } }),
      prisma.systemConfig.findUnique({ where: { key: "epay_url" } }),
    ]);

    // Build payment URLs
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const paymentData: Record<string, unknown> = {
      orderNo: order.orderNo,
      amount,
      tier,
      period,
    };

    // If Epay is configured, generate payment URL
    if (epayConfig?.value) {
      const epayUrl = epayConfig.value;
      const epayPid = await prisma.systemConfig.findUnique({ where: { key: "epay_pid" } });
      const epaySecret = await prisma.systemConfig.findUnique({ where: { key: "epay_secret" } });

      if (epayPid?.value && epaySecret?.value) {
        const notifyUrl = `${baseUrl}/api/webhook/epay`;
        const returnUrl = `${baseUrl}/billing?success=true`;

        // Generate Epay payment URL (simplified)
        const payUrl = `${epayUrl}/submit.php?pid=${epayPid.value}&type=alipay&out_trade_no=${order.orderNo}&notify_url=${encodeURIComponent(notifyUrl)}&return_url=${encodeURIComponent(returnUrl)}&amount=${amount}&sitename=SkillPipe`;

        return NextResponse.json({
          order,
          paymentUrl: payUrl,
          qrcodeUrl: `${epayUrl}/qrcode.php?trade_no=${order.orderNo}&money=${amount}`,
        });
      }
    }

    // Return order details for manual payment (if no payment gateway configured)
    return NextResponse.json({
      order,
      paymentData,
      message: "请配置支付接口或联系管理员进行人工充值",
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 });
  }
}
