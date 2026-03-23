"use client";

import { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

interface Skill {
  id: string;
  name: string;
  customSlug: string;
}

interface ApiKey {
  id: string;
  keyBody: string;
  prefix: string;
  status: string;
  expireAt: string | null;
  totalQuota: number;
  usedQuota: number;
  createdAt: string;
  skill?: {
    name: string;
    customSlug: string;
  };
}

const EXPIRE_OPTIONS = [
  { label: "1 天", value: 1 },
  { label: "7 天", value: 7 },
  { label: "15 天", value: 15 },
  { label: "30 天", value: 30 },
  { label: "90 天", value: 90 },
  { label: "365 天", value: 365 },
  { label: "永久", value: -1 },
];

function KeyFactoryContent() {
  const searchParams = useSearchParams();
  const preselectedSkillId = searchParams.get("skill");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "generate">("list");

  // Generate form state
  const [selectedSkill, setSelectedSkill] = useState(preselectedSkillId || "");
  const [prefix, setPrefix] = useState("");
  const [expireDays, setExpireDays] = useState(30);
  const [totalQuota, setTotalQuota] = useState(0);
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<ApiKey[]>([]);

  // List state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [skillsRes, keysRes] = await Promise.all([
        fetch("/api/developer/skills"),
        fetch("/api/developer/keys"),
      ]);

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData);
        if (skillsData.length > 0 && !selectedSkill) {
          setSelectedSkill(skillsData[0].id);
        }
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSkill || !prefix) {
      alert("请填写必填字段");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/developer/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedSkill,
          prefix: prefix.toLowerCase(),
          expireDays,
          totalQuota,
          count,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedKeys(data.keys);
        fetchData();
      } else {
        alert(data.error || "生成失败");
      }
    } catch {
      alert("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个 API Key 吗？")) return;

    try {
      const res = await fetch(`/api/developer/keys?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllKeys = () => {
    const allKeys = generatedKeys.map((k) => k.keyBody).join("\n");
    navigator.clipboard.writeText(allKeys);
  };

  const formatExpireAt = (date: string | null) => {
    if (!date) return "永久";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 text-xs rounded bg-green-600/20 text-green-400">活跃</span>;
      case "DISABLED":
        return <span className="px-2 py-0.5 text-xs rounded bg-yellow-600/20 text-yellow-400">已禁用</span>;
      case "EXPIRED":
        return <span className="px-2 py-0.5 text-xs rounded bg-red-600/20 text-red-400">已过期</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">卡密工厂</h1>
          <p className="text-gray-400">批量生成和管理 API Keys</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#262626]">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-3 px-2 text-sm font-medium transition-colors ${
            activeTab === "list"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Key 列表
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`pb-3 px-2 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          生成 Keys
        </button>
      </div>

      {activeTab === "list" ? (
        <>
          {keys.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-400 mb-4">还没有 API Keys</p>
              <Button variant="secondary" onClick={() => setActiveTab("generate")}>
                去生成 Keys
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#0a0a0a]">
                  <tr className="text-left text-sm text-gray-400">
                    <th className="px-4 py-3 font-medium">Key</th>
                    <th className="px-4 py-3 font-medium">项目</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">额度</th>
                    <th className="px-4 py-3 font-medium">到期</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {keys.map((key) => (
                    <tr key={key.id} className="text-sm">
                      <td className="px-4 py-3">
                        <div
                          className="text-indigo-400 cursor-pointer hover:text-indigo-300 font-mono"
                          onClick={() => copyToClipboard(key.keyBody)}
                          title="点击复制"
                        >
                          {key.keyBody.substring(0, 20)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {key.skill?.name || "-"}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(key.status)}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {key.usedQuota} / {key.totalQuota === 0 ? "∞" : key.totalQuota}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatExpireAt(key.expireAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(key.id)}
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">批量生成 API Keys</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Select Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  选择项目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-lg text-white"
                >
                  <option value="">选择项目</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.customSlug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prefix */}
              <Input
                label="自定义前缀 *"
                placeholder="myapp"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toLowerCase())}
              />
              <p className="text-xs text-gray-500">
                最终生成: pm-{prefix || "xxx"}-xxxxxxxxxxxxxxxx
              </p>

              {/* Expire Days */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  有效期
                </label>
                <select
                  value={expireDays}
                  onChange={(e) => setExpireDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#161616] border border-[#262626] rounded-lg text-white"
                >
                  {EXPIRE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Quota */}
              <Input
                label="额度（0 = 无限）"
                type="number"
                min={0}
                value={totalQuota}
                onChange={(e) => setTotalQuota(Number(e.target.value))}
              />

              {/* Count */}
              <Input
                label="生成数量"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedSkill || !prefix}
                className="w-full mt-4"
              >
                {generating ? "生成中..." : "生成 Keys"}
              </Button>
            </div>

            {/* Generated Keys */}
            <div>
              {generatedKeys.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-300">
                      已生成 {generatedKeys.length} 个 Keys
                    </h3>
                    <Button variant="secondary" size="sm" onClick={copyAllKeys}>
                      复制全部
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedKeys.map((k) => k.keyBody).join("\n")}
                    className="w-full h-64 px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-green-400 font-mono text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔑</div>
                    <p>生成的 Keys 将在此显示</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function KeysPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
      <KeyFactoryContent />
    </Suspense>
  );
}
