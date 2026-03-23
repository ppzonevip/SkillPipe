"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.email || !form.password) {
      setError("请填写所有必填项");
      return;
    }

    if (form.username.length < 2) {
      setError("用户名至少2个字符");
      return;
    }

    if (form.password.length < 6) {
      setError("密码长度至少6位");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      // Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      // Auto login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.token) {
        // Store token in localStorage for demo
        localStorage.setItem("token", loginData.token);
        router.push("/dashboard");
      } else {
        setError("注册成功，请登录");
        router.push("/login");
      }
    } catch {
      setError("注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">注册 SkillPipe</h1>
          <p className="text-gray-400 text-sm">创建你的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            name="username"
            type="text"
            label="用户名"
            placeholder="输入用户名"
            value={form.username}
            onChange={handleChange}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="邮箱"
            placeholder="your@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="密码"
            placeholder="至少6位"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="确认密码"
            placeholder="再次输入密码"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            已有账号？{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              立即登录
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
