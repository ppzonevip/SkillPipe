"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  membershipTier: number;
  balance: number;
}

const tierColors: Record<number, string> = {
  0: "bg-gray-600",
  1: "bg-blue-500",
  2: "bg-amber-500",
};

const tierLabels: Record<number, string> = {
  0: "免费",
  1: "初级",
  2: "高级",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <header className="h-16 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-6">
        <div className="animate-pulse bg-[#262626] h-8 w-32 rounded" />
      </header>
    );
  }

  if (!user) {
    return (
      <header className="h-16 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold text-white">
          SkillPipe
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/login"
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            登录
          </Link>
          <Link
            href="/register"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/register"
                ? "bg-indigo-600 text-white"
                : "bg-[#262626] text-white hover:bg-[#333]"
            }`}
          >
            注册
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-6">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        SkillPipe
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user.name}</span>

          <span
            className={`px-2 py-0.5 text-xs font-medium rounded text-white ${tierColors[user.membershipTier]}`}
          >
            {tierLabels[user.membershipTier] || "免费"}
          </span>

          <span className="text-sm font-medium text-gray-300">
            ¥{(user.balance || 0).toFixed(2)}
          </span>
        </div>

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            管理后台
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-[#262626] hover:bg-[#333] rounded-lg transition-colors"
        >
          退出
        </button>
      </div>
    </header>
  );
}
