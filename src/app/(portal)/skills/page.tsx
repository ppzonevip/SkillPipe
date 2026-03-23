"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface Skill {
  id: string;
  name: string;
  description: string | null;
  targetUrl: string;
  customSlug: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    apiKeys: number;
  };
}

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetUrl: "",
    customSlug: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/developer/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/developer/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }

      setShowModal(false);
      setForm({ name: "", description: "", targetUrl: "", customSlug: "" });
      fetchSkills();
    } catch {
      setError("创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个项目吗？相关的所有 API Keys 也会被删除。")) {
      return;
    }

    try {
      const res = await fetch(`/api/developer/skills/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSkills();
      }
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          <h1 className="text-2xl font-bold text-white mb-2">项目管理</h1>
          <p className="text-gray-400">管理你的 AI 技能项目</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ 创建项目</Button>
      </div>

      {skills.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-4">还没有项目</p>
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            创建第一个项目
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        skill.isActive
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {skill.isActive ? "活跃" : "已禁用"}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-gray-400 text-sm mb-3">{skill.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Slug: </span>
                      <span
                        className="text-indigo-400 cursor-pointer hover:text-indigo-300"
                        onClick={() =>
                          copyToClipboard(`api.yourdomain.com/v1/proxy/${skill.customSlug}`)
                        }
                        title="点击复制"
                      >
                        {skill.customSlug}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">目标: </span>
                      <span className="text-gray-300">{skill.targetUrl}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Keys: </span>
                      <span className="text-gray-300">{skill._count?.apiKeys || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/keys?skill=${skill.id}`)}
                  >
                    管理 Keys
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(skill.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">创建项目</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="项目名称"
                placeholder="我的 AI 助手"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="描述（可选）"
                placeholder="项目描述"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                label="目标 URL"
                placeholder="https://api.example.com/v1/chat"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                required
              />
              <Input
                label="自定义 Slug"
                placeholder="my-assistant"
                value={form.customSlug}
                onChange={(e) =>
                  setForm({ ...form, customSlug: e.target.value.toLowerCase() })
                }
                required
              />
              <p className="text-xs text-gray-500">
                API 地址: api.yourdomain.com/v1/proxy/{form.customSlug || "xxx"}
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "创建中..." : "创建"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
