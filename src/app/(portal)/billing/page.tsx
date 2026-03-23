"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TierConfig {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  apiQuota: string;
  maxProjects: string;
}

interface TierConfigFull {
  tier1: TierConfig;
  tier2: TierConfig;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const [tiers, setTiers] = useState<TierConfigFull>({
    tier1: { name: "初级会员", monthlyPrice: "29.9", yearlyPrice: "299", apiQuota: "10000", maxProjects: "5" },
    tier2: { name: "高级会员", monthlyPrice: "99.9", yearlyPrice: "999", apiQuota: "0", maxProjects: "-1" },
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        if (data.membership_tiers) {
          setTiers(JSON.parse(data.membership_tiers));
        }
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tier: number, period: string) => {
    setPurchasing(tier);
    setMessage("");

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, period }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "创建订单失败");
        return;
      }

      // If payment URL is provided, redirect to payment
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // If no payment gateway, show message
      if (data.message) {
        setMessage(data.message);
      }
    } catch {
      setMessage("创建订单失败，请重试");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">开通会员</h1>
        <p className="text-gray-400">选择适合你的会员套餐，解锁更多功能</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-600/20 border border-green-600/50 rounded-lg">
          <p className="text-green-400 text-center">支付成功！会员已开通。</p>
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
          <p className="text-yellow-400 text-center">{message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tier 1 */}
          <Card className="p-6 border-blue-600/30">
            <div className="text-center mb-6">
              <span className="px-4 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-full">
                {tiers.tier1.name}
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">¥{tiers.tier1.monthlyPrice}</span>
                <span className="text-gray-400">/月</span>
              </div>
              <div className="text-gray-500 text-sm mt-1">
                年付 ¥{tiers.tier1.yearlyPrice}/年
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>API 配额: {tiers.tier1.apiQuota} 次/月</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>最多 {tiers.tier1.maxProjects} 个项目</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>优先级支持</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handlePurchase(1, "monthly")}
                disabled={purchasing === 1}
              >
                {purchasing === 1 ? "处理中..." : "月付 ¥" + tiers.tier1.monthlyPrice}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handlePurchase(1, "yearly")}
                disabled={purchasing === 1}
              >
                {purchasing === 1 ? "处理中..." : "年付 ¥" + tiers.tier1.yearlyPrice}
              </Button>
            </div>
          </Card>

          {/* Tier 2 */}
          <Card className="p-6 border-amber-600/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-3 py-1 rounded-bl-lg">
              推荐
            </div>

            <div className="text-center mb-6">
              <span className="px-4 py-1 bg-amber-600/20 text-amber-400 text-sm font-medium rounded-full">
                {tiers.tier2.name}
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">¥{tiers.tier2.monthlyPrice}</span>
                <span className="text-gray-400">/月</span>
              </div>
              <div className="text-gray-500 text-sm mt-1">
                年付 ¥{tiers.tier2.yearlyPrice}/年
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>无限 API 配额</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>无限项目数</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>最高优先级支持</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>自定义 Slug</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => handlePurchase(2, "monthly")}
                disabled={purchasing === 2}
              >
                {purchasing === 2 ? "处理中..." : "月付 ¥" + tiers.tier2.monthlyPrice}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handlePurchase(2, "yearly")}
                disabled={purchasing === 2}
              >
                {purchasing === 2 ? "处理中..." : "年付 ¥" + tiers.tier2.yearlyPrice}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>支付成功后，会员权限将自动到账</p>
        <p className="mt-1">如有疑问，请联系客服</p>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
      <BillingContent />
    </Suspense>
  );
}
