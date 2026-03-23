"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Config {
  alipay_app_id?: string;
  alipay_merchant_key?: string;
  wxpay_app_id?: string;
  wxpay_mch_id?: string;
  wxpay_api_key?: string;
  epay_url?: string;
  epay_secret?: string;
  epay_pid?: string;
  default_quota?: string;
  member_lock_on_expire?: string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>({});
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
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
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

  const handleChange = (key: string, value: string) => {
    setConfig({ ...config, [key]: value });
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
        <h1 className="text-2xl font-bold text-white mb-2">系统设置</h1>
        <p className="text-gray-400">配置支付接口和系统参数</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-600/20 text-green-400 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Alipay Config */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">支付宝配置</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="App ID"
            placeholder="支付宝应用 AppID"
            value={config.alipay_app_id || ""}
            onChange={(e) => handleChange("alipay_app_id", e.target.value)}
          />
          <Input
            label="商户密钥"
            placeholder="支付宝商户私钥"
            value={config.alipay_merchant_key || ""}
            onChange={(e) => handleChange("alipay_merchant_key", e.target.value)}
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => handleSave("alipay_app_id", config.alipay_app_id || "")}
          disabled={saving}
          variant="secondary"
        >
          保存支付宝配置
        </Button>
      </Card>

      {/* Wechat Pay Config */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">微信支付配置</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="App ID"
            placeholder="微信应用 AppID"
            value={config.wxpay_app_id || ""}
            onChange={(e) => handleChange("wxpay_app_id", e.target.value)}
          />
          <Input
            label="商户号"
            placeholder="微信商户号 MchID"
            value={config.wxpay_mch_id || ""}
            onChange={(e) => handleChange("wxpay_mch_id", e.target.value)}
          />
          <Input
            label="API Key"
            placeholder="微信 API Key"
            value={config.wxpay_api_key || ""}
            onChange={(e) => handleChange("wxpay_api_key", e.target.value)}
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => handleSave("wxpay_app_id", config.wxpay_app_id || "")}
          disabled={saving}
          variant="secondary"
        >
          保存微信支付配置
        </Button>
      </Card>

      {/* Epay Config */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">易支付/码支付配置</h2>
        <p className="text-gray-400 text-sm mb-4">
          适用于个人搭建的第三方支付平台
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="接口地址"
            placeholder="https://pay.example.com"
            value={config.epay_url || ""}
            onChange={(e) => handleChange("epay_url", e.target.value)}
          />
          <Input
            label="商户 ID (PID)"
            placeholder="易支付商户号"
            value={config.epay_pid || ""}
            onChange={(e) => handleChange("epay_pid", e.target.value)}
          />
          <Input
            label="商户密钥"
            placeholder="易支付密钥"
            value={config.epay_secret || ""}
            onChange={(e) => handleChange("epay_secret", e.target.value)}
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => handleSave("epay_url", config.epay_url || "")}
          disabled={saving}
          variant="secondary"
        >
          保存易支付配置
        </Button>
      </Card>

      {/* System Config */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">系统参数</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="新用户默认配额"
            type="number"
            placeholder="100"
            value={config.default_quota || "100"}
            onChange={(e) => handleChange("default_quota", e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              会员到期后锁定 API
            </label>
            <select
              value={config.member_lock_on_expire || "true"}
              onChange={(e) => handleChange("member_lock_on_expire", e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-lg text-white"
            >
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => handleSave("default_quota", config.default_quota || "100")}
          disabled={saving}
          variant="secondary"
        >
          保存系统参数
        </Button>
      </Card>
    </div>
  );
}
