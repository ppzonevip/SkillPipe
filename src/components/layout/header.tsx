"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <header className="h-16 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-6">
        <div className="animate-pulse bg-[#262626] h-8 w-32 rounded" />
      </header>
    );
  }

  if (!session) {
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
          <span className="text-sm text-gray-300">{session.user.name}</span>

          <span
            className={`px-2 py-0.5 text-xs font-medium rounded text-white ${tierColors[session.user.membershipTier]}`}
          >
            {tierLabels[session.user.membershipTier] || "免费"}
          </span>

          <span className="text-sm font-medium text-gray-300">
            ¥{session.user.balance?.toFixed(2) || "0.00"}
          </span>
        </div>

        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            管理后台
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-[#262626] hover:bg-[#333] rounded-lg transition-colors"
        >
          退出
        </button>
      </div>
    </header>
  );
}
