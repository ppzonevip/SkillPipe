"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TierConfig {
  tier1: {
    name: string;
    monthlyPrice: string;
    yearlyPrice: string;
    apiQuota: string;
    maxProjects: string;
  };
  tier2: {
    name: string;
    monthlyPrice: string;
    yearlyPrice: string;
    apiQuota: string;
    maxProjects: string;
  };
}

export default function AdminTiersPage() {
  const [config, setConfig] = useState<TierConfig>({
    tier1: {
      name: "初级会员",
      monthlyPrice: "29.9",
      yearlyPrice: "299",
      apiQuota: "10000",
      maxProjects: "5",
    },
    tier2: {
      name: "高级会员",
      monthlyPrice: "99.9",
      yearlyPrice: "999",
      apiQuota: "0",
      maxProjects: "-1",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          setConfig(JSON.parse(data.membership_tiers));
        }
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "membership_tiers",
          value: JSON.stringify(config),
        }),
      });

      if (res.ok) {
        setMessage("保存成功");
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("保存失败");
      }
    } catch {
      setMessage("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (
    tier: "tier1" | "tier2",
    field: string,
    value: string
  ) => {
    setConfig({
      ...config,
      [tier]: {
        ...config[tier],
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">会员套餐</h1>
        <p className="text-gray-400">配置会员等级和价格</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-600/20 text-green-400 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Tier 1 */}
      <Card className="mb-6 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded">
            初级会员
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="套餐名称"
            value={config.tier1.name}
            onChange={(e) => updateTier("tier1", "name", e.target.value)}
          />
          <Input
            label="月付价格 (¥)"
            type="number"
            step="0.01"
            value={config.tier1.monthlyPrice}
            onChange={(e) => updateTier("tier1", "monthlyPrice", e.target.value)}
          />
          <Input
            label="年付价格 (¥)"
            type="number"
            step="0.01"
            value={config.tier1.yearlyPrice}
            onChange={(e) => updateTier("tier1", "yearlyPrice", e.target.value)}
          />
          <Input
            label="API 配额 (0=无限)"
            type="number"
            value={config.tier1.apiQuota}
            onChange={(e) => updateTier("tier1", "apiQuota", e.target.value)}
          />
          <Input
            label="最大项目数 (-1=无限)"
            type="number"
            value={config.tier1.maxProjects}
            onChange={(e) => updateTier("tier1", "maxProjects", e.target.value)}
          />
        </div>
      </Card>

      {/* Tier 2 */}
      <Card className="mb-6 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-amber-600/20 text-amber-400 text-sm font-medium rounded">
            高级会员
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="套餐名称"
            value={config.tier2.name}
            onChange={(e) => updateTier("tier2", "name", e.target.value)}
          />
          <Input
            label="月付价格 (¥)"
            type="number"
            step="0.01"
            value={config.tier2.monthlyPrice}
            onChange={(e) => updateTier("tier2", "monthlyPrice", e.target.value)}
          />
          <Input
            label="年付价格 (¥)"
            type="number"
            step="0.01"
            value={config.tier2.yearlyPrice}
            onChange={(e) => updateTier("tier2", "yearlyPrice", e.target.value)}
          />
          <Input
            label="API 配额 (0=无限)"
            type="number"
            value={config.tier2.apiQuota}
            onChange={(e) => updateTier("tier2", "apiQuota", e.target.value)}
          />
          <Input
            label="最大项目数 (-1=无限)"
            type="number"
            value={config.tier2.maxProjects}
            onChange={(e) => updateTier("tier2", "maxProjects", e.target.value)}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存套餐配置"}
        </Button>
      </div>
    </div>
  );
}
