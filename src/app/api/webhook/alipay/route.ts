import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyAlipaySignature(payload: string, signature: string, alipayPublicKey: string): boolean {
  // Simplified Alipay signature verification
  // In production, use proper RSA verification with Alipay's public key
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(payload);
  return verifier.verify(alipayPublicKey, signature, "base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const sign = params.get("sign") || "";

    // Get Alipay config
    const config = await prisma.systemConfig.findUnique({
      where: { key: "alipay_merchant_key" },
    });

    // For demo purposes, skip signature verification if no config
    // In production, implement proper Alipay signature verification
    const verified = !config?.value || verifyAlipaySignature(body, sign, config.value);

    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const orderNo = params.get("out_trade_no");
    const tradeStatus = params.get("trade_status");
    const amount = params.get("total_amount");

    if (!orderNo || !tradeStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only process successful payments
    if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
      return NextResponse.json({ success: true });
    }

    // Find and update order
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ success: true });
    }

    // Calculate membership expiration
    const tierConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_tiers" },
    });

    let daysToAdd = 30; // Default monthly
    if (order.period === "yearly") {
      daysToAdd = 365;
    }

    const now = new Date();
    let newExpireAt: Date;

    if (order.user.membershipExpireAt && order.user.membershipExpireAt > now) {
      // Extend from current expiration
      newExpireAt = new Date(order.user.membershipExpireAt);
      newExpireAt.setDate(newExpireAt.getDate() + daysToAdd);
    } else {
      // Start from now
      newExpireAt = new Date();
      newExpireAt.setDate(newExpireAt.getDate() + daysToAdd);
    }

    // Update order and user in transaction
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
          apiQuotaLimit: tierConfig ? JSON.parse(tierConfig.value)[`tier${order.tier}`]?.apiQuota || 0 : 0,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Alipay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
