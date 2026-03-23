"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

const bannerImages = [
  {
    title: "AI 技能授权平台",
    subtitle: "为 AI 开发者提供专业的 API 密钥管理与变现解决方案",
    emoji: "🚀",
    gradient: "from-indigo-900/50 to-purple-900/50",
  },
  {
    title: "安全可靠的网关服务",
    subtitle: "四重校验机制，保障您的 API 安全",
    emoji: "🔒",
    gradient: "from-emerald-900/50 to-teal-900/50",
  },
  {
    title: "灵活的会员体系",
    subtitle: "多等级会员按需选择，月付年付灵活订阅",
    emoji: "💳",
    gradient: "from-amber-900/50 to-orange-900/50",
  },
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Banner */}
      <section className="relative h-[400px] overflow-hidden">
        {bannerImages.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBanner ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${banner.gradient}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-6">{banner.emoji}</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {banner.title}
                </h1>
                <p className="text-xl text-gray-300 mb-8">{banner.subtitle}</p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/register"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    立即开始
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors backdrop-blur-sm"
                  >
                    登录账号
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Banner Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBanner ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-8">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-lg font-semibold text-white mb-2">卡密工厂</h3>
              <p className="text-gray-400 text-sm">
                批量生成 pm- 前缀 API Keys，支持自定义抬头和有效期
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-white mb-2">会员系统</h3>
              <p className="text-gray-400 text-sm">
                多等级会员管理，月付/年付灵活订阅
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">核心网关</h3>
              <p className="text-gray-400 text-sm">
                四重校验 + Redis 缓存，高性能反向代理
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-8 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            快速上手
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-6 bg-[#161616] rounded-xl text-center">
              <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h4 className="text-white font-medium mb-2">注册账号</h4>
              <p className="text-gray-400 text-sm">创建你的开发者账号</p>
            </div>
            <div className="p-6 bg-[#161616] rounded-xl text-center">
              <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h4 className="text-white font-medium mb-2">创建项目</h4>
              <p className="text-gray-400 text-sm">添加你的 AI 服务</p>
            </div>
            <div className="p-6 bg-[#161616] rounded-xl text-center">
              <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h4 className="text-white font-medium mb-2">生成密钥</h4>
              <p className="text-gray-400 text-sm">批量生成 API Keys</p>
            </div>
            <div className="p-6 bg-[#161616] rounded-xl text-center">
              <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                4
              </div>
              <h4 className="text-white font-medium mb-2">开始变现</h4>
              <p className="text-gray-400 text-sm">分发密钥获取收益</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-gray-400 mb-8">
            立即注册，开始你的 AI 技能变现之旅
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            立即注册
          </Link>
        </div>
      </section>
    </div>
  );
}
