# SkillPipe - AI Skill 授权与分发 SaaS 平台

## 1. 项目概述

### 1.1 项目名称与定位
- **项目名称**: SkillPipe
- **项目类型**: SaaS 平台（Next.js 全栈应用）
- **核心定位**: 为 AI 开发者提供 API 密钥管理与变现的平台，支持卡密分发与会员订阅

### 1.2 核心功能矩阵
| 模块 | 功能描述 |
|------|----------|
| 授权网关 | 反向代理 + 四重校验（Key 存在/有效期/会员状态/用量） |
| 卡密工厂 | 批量生成 pm- 前缀 API Keys，支持自定义抬头 |
| 会员系统 | 多等级会员（免费/初级/高级），月付/年付 |
| 支付集成 | 支付宝/微信支付/易支付 Webhook 回调 |
| 站长后台 | 套餐配置、支付参数、系统设置 |
| 开发者控制台 | 项目管理、API Keys 管理、用量统计 |

---

## 2. 技术栈

### 2.1 核心框架
- **前端**: Next.js 14+ (App Router)
- **样式**: Tailwind CSS
- **数据库 ORM**: Prisma
- **数据库**: SQLite（开发）/ PostgreSQL（生产）
- **缓存**: Redis（用于 API Key 高频校验）
- **认证**: NextAuth.js (Auth.js) + JWT + HttpOnly Cookie
- **支付**: 支付宝/微信支付官方 API + 易支付兼容

### 2.2 目录结构
```
skillpipe/
├── prisma/
│   └── schema.prisma          # 数据库 Schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # 认证路由组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (portal)/          # 开发者控制台
│   │   │   ├── dashboard/
│   │   │   ├── skills/
│   │   │   ├── keys/
│   │   │   └── billing/
│   │   ├── admin/             # 站长后台
│   │   │   ├── settings/
│   │   │   ├── tiers/
│   │   │   └── payments/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── gateway/[slug]/ # 核心网关路由
│   │   │   └── webhook/        # 支付回调
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # 基础 UI 组件
│   │   ├── layout/            # 布局组件（Header等）
│   │   └── forms/             # 表单组件
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端
│   │   ├── redis.ts           # Redis 客户端
│   │   ├── auth.ts            # NextAuth 配置
│   │   └── gateway.ts         # 网关校验逻辑
│   └── types/
│       └── index.ts
├── package.json
└── next.config.js
```

---

## 3. UI/UX 规范

### 3.1 设计语言
- **参考风格**: Dujiao-Next 暗色卡片风格
- **主题**: Dark Mode 为主

### 3.2 配色方案
| 用途 | 色值 |
|------|------|
| 背景色 | `#0a0a0a` |
| 卡片背景 | `#161616` |
| 边框色 | `#262626` |
| 主色调 | `#6366f1` (Indigo) |
| 成功色 | `#22c55e` |
| 警告色 | `#f59e0b` |
| 错误色 | `#ef4444` |
| 文字主色 | `#ffffff` |
| 文字次色 | `#a1a1aa` |

### 3.3 持久化会话与 Header 规范

#### Header 必须元素（已登录状态）
```
[Logo]                      [用户名] [会员标签] [余额] [退出登录]
```
- **会员标签颜色**:
  - 免费用户: 灰色 `#6b7280`
  - 初级会员: 蓝色 `#3b82f6`
  - 高级会员: 金色 `#f59e0b`

#### 路由守卫规则
- 未登录用户访问 `/dashboard/*`、`/admin/*` → 重定向至 `/login`
- 未登录用户访问 `/api/gateway/*` → 返回 401

---

## 4. 数据库架构 (Prisma Schema)

### 4.1 ER 图关系
```
User (1) ──────────< (N) Skill
User (1) ──────────< (N) ApiKey
User (1) ──────────< (N) Order
Skill (1) ─────────< (N) ApiKey
ApiKey (1) ───────< (N) RequestLog
```

### 4.2 表结构定义

#### User 用户表
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  avatar            String?
  role              Role      @default(USER)
  membershipTier    Int       @default(0)      // 0=免费, 1=初级, 2=高级
  membershipExpireAt DateTime? @default(now()) @map("membership_expire_at")
  apiQuotaLimit     Int       @default(100)   @map("api_quota_limit")
  apiQuotaUsed      Int       @default(0)     @map("api_quota_used")
  balance           Float     @default(0)     // 余额（预留）

  skills            Skill[]
  apiKeys           ApiKey[]
  orders            Order[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

#### Skill 开发者项目表
```prisma
model Skill {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  description String?
  targetUrl   String   @map("target_url")
  customSlug  String   @unique @map("custom_slug")
  isActive    Boolean  @default(true) @map("is_active")

  user        User     @relation(fields: [userId], references: [id])
  apiKeys     ApiKey[]
  logs        RequestLog[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("skills")
}
```

#### ApiKey 卡密表
```prisma
model ApiKey {
  id          String    @id @default(cuid())
  skillId     String    @map("skill_id")
  userId      String    @map("user_id")
  keyBody     String    @unique @map("key_body")
  prefix      String    // pm-自定义抬头
  status      KeyStatus @default(ACTIVE)
  expireAt    DateTime? @map("expire_at")
  totalQuota  Int       @default(0)    @map("total_quota")   // 0=无限
  usedQuota   Int       @default(0)  @map("used_quota")

  skill       Skill     @relation(fields: [skillId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  logs        RequestLog[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("api_keys")
}

enum KeyStatus {
  ACTIVE
  DISABLED
  EXPIRED
}
```

#### Order 订单表
```prisma
model Order {
  id          String      @id @default(cuid())
  userId      String      @map("user_id")
  orderNo     String      @unique @map("order_no")
  amount      Float
  tier        Int         // 购买的会员等级
  period      String      // monthly / yearly
  status      OrderStatus @default(PENDING)
  paidAt      DateTime?   @map("paid_at")

  user        User        @relation(fields: [userId], references: [id])

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@map("orders")
}

enum OrderStatus {
  PENDING
  PAID
  CANCELLED
  REFUNDED
}
```

#### SystemConfig 系统配置表
```prisma
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON 存储
  updatedAt DateTime @updatedAt

  @@map("system_configs")
}
```

#### RequestLog 请求日志表
```prisma
model RequestLog {
  id          String   @id @default(cuid())
  apiKeyId    String   @map("api_key_id")
  skillId     String   @map("skill_id")
  userId      String   @map("user_id")
  method      String
  path        String
  statusCode  Int      @map("status_code")
  errorMsg    String?  @map("error_msg")
  duration    Int      // 毫秒
  ip          String?

  apiKey      ApiKey   @relation(fields: [apiKeyId], references: [id])
  skill       Skill    @relation(fields: [skillId], references: [id])

  createdAt   DateTime @default(now())

  @@index([apiKeyId])
  @@index([skillId])
  @@index([createdAt])
  @@map("request_logs")
}
```

---

## 5. 功能模块详细说明

### 5.1 认证系统 (Auth)

#### 登录/注册页面
- 邮箱 + 密码登录
- 注册时自动设置默认配额（参考 system_configs 免费额度）
- 密码使用 bcrypt 哈希存储

#### 会话持久化
- JWT Token 存储在 HttpOnly Cookie
- NextAuth Session 实时同步登录状态

### 5.2 开发者控制台 (Developer Hub)

#### 5.2.1 仪表盘 (Dashboard)
- 本月配额使用率（环形图）
- 项目数量统计
- API Key 数量统计
- 最近请求日志

#### 5.2.2 项目管理 (Skills)
- 创建项目：名称 + 目标 URL + 自定义 Slug
- Slug 格式验证：`/api/gateway/[slug]` 路径
- 编辑/删除项目

#### 5.2.3 卡密工厂 (Key Factory)

**批量生成界面要素**:
| 要素 | 说明 |
|------|------|
| 自定义前缀 | 输入框，如 `myapp`，最终生成 `pm-myapp-xxxxx` |
| 有效期 | 下拉菜单：1天/7天/15天/30天/90天/365天/永久 |
| 额度设置 | 输入数字，0=无限 |
| 生成数量 | 1-100 |

**导出功能**:
- 生成完成后显示文本框
- 一键复制按钮
- 格式：每行一个 Key

### 5.3 站长后台 (Admin Panel)

#### 5.3.1 支付配置 (Payment Setup)
| 渠道 | 配置字段 |
|------|----------|
| 支付宝 | AppID, MerchantKey |
| 微信支付 | AppID, MchID, API Key |
| 易支付 | BaseURL, Secret, PID |

#### 5.3.2 会员套餐配置 (Tier Management)
```json
{
  "tier1": {
    "name": "初级会员",
    "monthlyPrice": 29.9,
    "yearlyPrice": 299,
    "apiQuota": 10000,
    "maxProjects": 5
  },
  "tier2": {
    "name": "高级会员",
    "monthlyPrice": 99.9,
    "yearlyPrice": 999,
    "apiQuota": 0,
    "maxProjects": -1
  }
}
```

#### 5.3.3 系统配置
- 新用户默认配额
- 会员到期后是否锁定 API

### 5.4 核心网关 (Gateway Engine)

#### 请求拦截路由
```
POST/GET api.yourdomain.com/v1/proxy/[slug]
```

#### 四重校验流程
```
1. 提取 x-api-key header
2. Key 存在性校验 → Redis 缓存 → DB 回源
3. Key 有效期校验 → 检查 expire_at
4. 开发者状态校验 → User.membership 有效性
5. 用量校验 → used_quota < total_quota
6. 转发 → 反向代理到 Skill.target_url
```

#### 校验失败响应
| 错误码 | 错误信息 |
|--------|----------|
| 401 | `Missing API Key` |
| 403 | `Invalid API Key` |
| 403 | `Key Expired` |
| 403 | `Developer Membership Expired` |
| 403 | `Quota Exceeded` |
| 502 | `Upstream Error` |

#### 成功转发
- 保留原始请求方法、Headers、Body
- 添加响应头：`X-Request-Id`, `X-RateLimit-Remaining`

### 5.5 支付回调 (Payment Webhook)

#### 处理流程
```
1. 接收支付平台 POST Webhook
2. 验证签名 (支付宝/微信/易支付)
3. 解析订单信息 (orderNo, amount, tier)
4. 更新 Order 状态为 PAID
5. 更新 User.membershipTier 和 membershipExpireAt
6. 返回 200 OK
```

---

## 6. API 设计

### 6.1 认证 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/session` | 获取当前会话 |

### 6.2 开发者 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/developer/skills` | 获取项目列表 |
| POST | `/api/developer/skills` | 创建项目 |
| PUT | `/api/developer/skills/[id]` | 更新项目 |
| DELETE | `/api/developer/skills/[id]` | 删除项目 |
| GET | `/api/developer/keys` | 获取 Key 列表 |
| POST | `/api/developer/keys/generate` | 批量生成 Keys |
| DELETE | `/api/developer/keys/[id]` | 删除 Key |
| GET | `/api/developer/logs` | 获取请求日志 |

### 6.3 管理员 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/config` | 获取系统配置 |
| PUT | `/api/admin/config` | 更新系统配置 |
| GET | `/api/admin/users` | 用户列表 |
| PUT | `/api/admin/users/[id]` | 更新用户 |

### 6.4 网关 API
| 方法 | 路径 | 说明 |
|------|------|------|
| * | `/api/gateway/[slug]` | 代理转发 |

### 6.5 支付 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/webhook/alipay` | 支付宝回调 |
| POST | `/api/webhook/wxpay` | 微信支付回调 |
| POST | `/api/webhook/epay` | 易支付回调 |
| GET | `/api/payment/create` | 创建支付订单 |

---

## 7. 实施步骤

### Step 1: 基础搭建
- [ ] 初始化 Next.js + Tailwind + Prisma 项目
- [ ] 配置 Prisma Schema，创建 User, Skill, ApiKey 表
- [ ] 实现 NextAuth 登录注册
- [ ] 实现 Header 组件（用户名/会员等级/余额/退出）
- [ ] 路由守卫（未登录重定向）

### Step 2: 开发者控制台
- [ ] Dashboard 页面
- [ ] Skills 管理（CRUD）
- [ ] 卡密工厂（批量生成 + 导出）

### Step 3: 站长后台
- [ ] /admin 路由保护
- [ ] 支付配置页面
- [ ] 会员套餐配置
- [ ] system_configs 持久化

### Step 4: 核心网关
- [ ] Redis 连接配置
- [ ] 四重校验中间件
- [ ] 反向代理转发
- [ ] request_logs 记录

### Step 5: 支付集成
- [ ] 支付页面（仿独角数卡风格）
- [ ] Webhook 处理程序
- [ ] 会员等级自动升级

### Step 6: 优化与测试
- [ ] Redis 缓存策略优化
- [ ] 日志查询功能
- [ ] 完整测试

---

## 8. 环境变量 (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Payment (示例)
ALIPAY_APP_ID=""
ALIPAY_MERCHANT_KEY=""
WECHAT_APP_ID=""
WECHAT_MCH_ID=""
WECHAT_API_KEY=""
EPAY_URL=""
EPAY_SECRET=""

# Gateway
API_DOMAIN="api.yourdomain.com"
```

---

## 9. 验收标准

### 9.1 功能验收
- [ ] 用户可以注册、登录、退出
- [ ] Header 实时显示用户信息
- [ ] 开发者可以创建项目并获取 Slug
- [ ] 卡密工厂可以批量生成 pm- 前缀 Keys
- [ ] 管理员可以配置支付参数和会员套餐
- [ ] 网关正确拦截并校验请求
- [ ] 支付回调能正确升级会员

### 9.2 性能验收
- [ ] 网关校验使用 Redis 缓存
- [ ] 数据库查询有适当索引
- [ ] 日志异步写入

### 9.3 安全验收
- [ ] 密码 bcrypt 加密存储
- [ ] HttpOnly Cookie 存储 JWT
- [ ] 路由守卫完整
- [ ] Webhook 签名验证

---

*文档版本: 1.0*
*创建日期: 2026-03-23*
