import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">
          SkillPipe
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          AI Skill 授权与分发 SaaS 平台
        </p>
        <p className="text-gray-500 mb-8">
          为 AI 开发者提供 API 密钥管理与变现的平台，支持卡密分发与会员订阅
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-4xl w-full">
        <Card className="text-center">
          <div className="text-3xl mb-3">🔑</div>
          <h3 className="text-lg font-semibold text-white mb-2">卡密工厂</h3>
          <p className="text-gray-400 text-sm">
            批量生成 pm- 前缀 API Keys，支持自定义抬头和有效期
          </p>
        </Card>

        <Card className="text-center">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-white mb-2">会员系统</h3>
          <p className="text-gray-400 text-sm">
            多等级会员管理，月付/年付灵活订阅
          </p>
        </Card>

        <Card className="text-center">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-white mb-2">核心网关</h3>
          <p className="text-gray-400 text-sm">
            四重校验 + Redis 缓存，高性能反向代理
          </p>
        </Card>
      </div>

      <div className="flex gap-4 mt-12">
        <Link
          href="/register"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          立即开始
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 bg-[#262626] hover:bg-[#333] text-white font-medium rounded-lg transition-colors"
        >
          登录账号
        </Link>
      </div>
    </div>
  );
}
