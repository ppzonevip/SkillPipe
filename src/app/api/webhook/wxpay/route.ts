import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyWechatSignature(payload: string, signature: string, apiKey: string): boolean {
  const expectedSign = crypto
    .createHash("sha256")
    .update(payload + "&key=" + apiKey)
    .digest("hex")
    .toUpperCase();
  return signature === expectedSign;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-wechat-signature") || "";

    // Get Wechat config
    const apiKeyConfig = await prisma.systemConfig.findUnique({
      where: { key: "wxpay_api_key" },
    });

    // For demo purposes, skip signature verification if no config
    // In production, implement proper Wechat Pay signature verification
    const verified = !apiKeyConfig?.value || verifyWechatSignature(JSON.stringify(body), signature, apiKeyConfig.value);

    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { transaction_id, out_trade_no, trade_state, total } = body;

    if (!out_trade_no || !trade_state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only process successful payments
    if (trade_state !== "SUCCESS") {
      return NextResponse.json({ success: true });
    }

    // Find and update order
    const order = await prisma.order.findUnique({
      where: { orderNo: out_trade_no },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ success: true });
    }

    // Calculate membership expiration
    let daysToAdd = 30; // Default monthly
    if (order.period === "yearly") {
      daysToAdd = 365;
    }

    const now = new Date();
    let newExpireAt: Date;

    if (order.user.membershipExpireAt && order.user.membershipExpireAt > now) {
      newExpireAt = new Date(order.user.membershipExpireAt);
      newExpireAt.setDate(newExpireAt.getDate() + daysToAdd);
    } else {
      newExpireAt = new Date();
      newExpireAt.setDate(newExpireAt.getDate() + daysToAdd);
    }

    // Update order and user
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: {
          membershipTier: order.tier,
          membershipExpireAt: newExpireAt,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wechat webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
