import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    userId = decoded.id;
  } catch {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: {
          _count: {
            select: { apiKeys: true },
          },
        },
      },
      apiKeys: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const totalQuotaUsed = user.apiKeys.reduce((acc, key) => acc + key.usedQuota, 0);
  const quotaPercentage = user.apiQuotaLimit > 0
    ? Math.round((totalQuotaUsed / user.apiQuotaLimit) * 100)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">控制台</h1>
        <p className="text-gray-400">欢迎回来，{user.email}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-gray-400 text-sm mb-1">配额使用</div>
          <div className="text-2xl font-bold text-white">{quotaPercentage}%</div>
          <div className="text-gray-500 text-xs mt-1">
            {totalQuotaUsed} / {user.apiQuotaLimit}
          </div>
        </Card>

        <Card className="text-center">
          <div className="text-gray-400 text-sm mb-1">项目数</div>
          <div className="text-2xl font-bold text-white">{user.skills.length}</div>
          <div className="text-gray-500 text-xs mt-1">个活跃项目</div>
        </Card>

        <Card className="text-center">
          <div className="text-gray-400 text-sm mb-1">API Keys</div>
          <div className="text-2xl font-bold text-white">{user.apiKeys.length}</div>
          <div className="text-gray-500 text-xs mt-1">个有效密钥</div>
        </Card>

        <Card className="text-center">
          <div className="text-gray-400 text-sm mb-1">会员等级</div>
          <div className="text-2xl font-bold text-white">
            {user.membershipTier === 0 ? "免费" : user.membershipTier === 1 ? "初级" : "高级"}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {user.membershipExpireAt
              ? `到期: ${new Date(user.membershipExpireAt).toLocaleDateString("zh-CN")}`
              : "未开通"}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">快速开始</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/skills" className="p-4 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <h3 className="text-white font-medium mb-2">1. 创建项目</h3>
            <p className="text-gray-400 text-sm mb-3">
              添加你的 AI 服务，配置目标 URL 和 Slug
            </p>
          </Link>
          <Link href="/keys" className="p-4 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <h3 className="text-white font-medium mb-2">2. 生成 API Key</h3>
            <p className="text-gray-400 text-sm mb-3">
              在卡密工厂批量生成密钥，设置有效期和额度
            </p>
          </Link>
          <Link href="/logs" className="p-4 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <h3 className="text-white font-medium mb-2">3. 查看日志</h3>
            <p className="text-gray-400 text-sm mb-3">
              监控 API 请求记录和错误日志
            </p>
          </Link>
          <Link href="/billing" className="p-4 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <h3 className="text-white font-medium mb-2">4. 开通会员</h3>
            <p className="text-gray-400 text-sm mb-3">
              升级会员获取更多配额和功能
            </p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
