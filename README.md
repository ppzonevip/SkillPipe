# SkillPipe - AI Skill 授权与分发 SaaS 平台

为 AI 开发者提供 API 密钥管理与变现的平台，支持卡密分发与会员订阅。

## 功能特性

- 🔐 **卡密工厂** - 批量生成 pm- 前缀 API Keys，支持自定义抬头和有效期
- 👥 **会员系统** - 多等级会员管理（月付/年付）
- 💳 **支付集成** - 支付宝/微信支付/易支付 Webhook 回调
- ⚡ **核心网关** - 四重校验 + Redis 缓存，高性能反向代理
- 📊 **请求日志** - 完整的 API 调用记录

## 技术栈

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis (可选)
- **认证**: NextAuth.js v5

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/skillpipe"
AUTH_SECRET="your-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
```

### 3. 数据库迁移

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── (auth)/           # 认证页面
│   │   ├── login/
│   │   └── register/
│   ├── (portal)/         # 开发者控制台
│   │   ├── dashboard/    # 仪表盘
│   │   ├── skills/       # 项目管理
│   │   ├── keys/         # 卡密工厂
│   │   ├── logs/         # 请求日志
│   │   └── billing/      # 会员购买
│   ├── admin/            # 站长后台
│   │   ├── settings/     # 系统设置
│   │   ├── tiers/        # 会员套餐
│   │   └── users/        # 用户管理
│   └── api/
│       ├── auth/         # 认证 API
│       ├── developer/    # 开发者 API
│       ├── admin/        # 管理员 API
│       ├── gateway/      # 网关代理
│       ├── payment/      # 支付 API
│       └── webhook/      # 支付回调
├── components/           # UI 组件
├── lib/                  # 工具函数
│   ├── prisma.ts       # Prisma 客户端
│   ├── redis.ts        # Redis 客户端
│   ├── auth.ts         # NextAuth 配置
│   └── gateway.ts      # 网关逻辑
└── types/              # TypeScript 类型
```

## 数据库

### 表结构

| 表 | 说明 |
|---|---|
| User | 用户表 |
| Skill | 项目表 |
| ApiKey | API Key 表 |
| Order | 订单表 |
| SystemConfig | 系统配置表 |
| RequestLog | 请求日志表 |

### 常用 SQL

```sql
-- 将用户设为管理员
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';

-- 重置用户配额
UPDATE "User" SET "apiQuotaUsed" = 0 WHERE "email" = 'user@example.com';
```

## API 使用

### 网关调用

```bash
curl -X POST https://api.example.com/v1/proxy/your-slug \
  -H "x-api-key: pm-your-prefix-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

### 响应头

| 头信息 | 说明 |
|--------|------|
| X-Request-Id | 请求唯一 ID |
| X-RateLimit-Remaining | 剩余配额 |

### 错误码

| 错误 | 状态码 |
|------|--------|
| Missing API Key | 401 |
| Invalid API Key | 403 |
| Key Expired | 403 |
| Developer Membership Expired | 403 |
| Quota Exceeded | 403 |
| Upstream Error | 502 |

## 配置支付

### 支付宝

在管理员后台设置：
- App ID
- 商户密钥

### 微信支付

- App ID
- 商户号 (MchID)
- API Key

### 易支付/码支付

- 接口地址
- 商户 ID (PID)
- 商户密钥

## 生产部署

```bash
npm run build
npm start
```

## 环境变量

```env
# 数据库 (PostgreSQL)
DATABASE_URL="postgresql://..."

# Redis (可选，用于 API Key 缓存)
REDIS_URL="redis://..."

# Auth
AUTH_SECRET="your-secret"
AUTH_URL="https://your-domain.com"
```

## License

MIT
