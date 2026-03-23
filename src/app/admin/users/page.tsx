"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  role: string;
  membershipTier: number;
  membershipExpireAt: string | null;
  apiQuotaLimit: number;
  apiQuotaUsed: number;
  balance: number;
  createdAt: string;
  _count: {
    skills: number;
    apiKeys: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 0:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-600/20 text-gray-400">免费</span>;
      case 1:
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-600/20 text-blue-400">初级</span>;
      case 2:
        return <span className="px-2 py-0.5 text-xs rounded bg-amber-600/20 text-amber-400">高级</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">用户管理</h1>
        <p className="text-gray-400">管理所有注册用户</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0a0a0a]">
            <tr className="text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">会员等级</th>
              <th className="px-4 py-3 font-medium">配额</th>
              <th className="px-4 py-3 font-medium">项目/Keys</th>
              <th className="px-4 py-3 font-medium">到期时间</th>
              <th className="px-4 py-3 font-medium">注册时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {users.map((user) => (
              <tr key={user.id} className="text-sm">
                <td className="px-4 py-3">
                  <div className="text-white">{user.email}</div>
                  {user.role === "ADMIN" && (
                    <span className="text-xs text-red-400">管理员</span>
                  )}
                </td>
                <td className="px-4 py-3">{getTierBadge(user.membershipTier)}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-300">
                    {user.apiQuotaUsed} / {user.apiQuotaLimit === 0 ? "∞" : user.apiQuotaLimit}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-300">
                    {user._count.skills} / {user._count.apiKeys}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {user.membershipExpireAt
                    ? formatDate(user.membershipExpireAt)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4 text-gray-400 text-sm">
        共 {users.length} 位用户
      </div>
    </div>
  );
}
