# Prisma → Drizzle ORM 迁移评估

## 📊 项目现状分析

### 当前 Prisma 使用情况

| 项目 | 统计 |
|------|------|
| **模型数量** | ~20 个 |
| **数据库** | SQLite (LibSQL) |
| **使用文件** | ~38 个文件引用 prisma |
| **适配器** | @prisma/adapter-libsql |
| **Prisma 版本** | ^7.2.0 |

### 主要模型
```
User, SystemRole, NavGroup, NavItem, RoleNavGroup, UserRoleNavGroup,
Session, Account, Verification, Organization, Member, Invitation,
Translation, SystemLog, AuditLog, QuestionBank 相关...
```

### 特殊功能使用
- ✅ 事务 (`$transaction`)
- ✅ 关联查询 (`include`)
- ✅ 嵌套写入
- ✅ LibSQL 适配器
- ✅ Prisma Studio
- ✅ Better Auth 集成 (`prismaAdapter`)

---

## 🆚 Prisma vs Drizzle 对比

### 性能

| 方面 | Prisma | Drizzle | 差异 |
|------|--------|---------|------|
| **冷启动** | ~300-500ms | ~50-100ms | ✅ Drizzle 5x 更快 |
| **查询执行** | 中等 | 非常快 | ✅ Drizzle 更快 |
| **Bundle 大小** | ~2MB+ | ~50KB | ✅ Drizzle 40x 更小 |
| **内存占用** | 较高 | 较低 | ✅ Drizzle 更优 |

### 开发体验

| 方面 | Prisma | Drizzle |
|------|--------|---------|
| **Schema 定义** | `schema.prisma` (DSL) | TypeScript |
| **类型安全** | ⭐⭐⭐⭐⭐ 极好 | ⭐⭐⭐⭐⭐ 极好 |
| **迁移** | 自动生成 + 手动调整 | 自动生成 (drizzle-kit) |
| **可视化工具** | Prisma Studio (优秀) | Drizzle Studio (较新) |
| **学习曲线** | 较低 | 中等 |
| **SQL 可见性** | 隐藏 | ✅ 完全可见 |
| **原始 SQL** | 支持 | ✅ 原生支持更好 |

### 生态系统

| 方面 | Prisma | Drizzle |
|------|--------|---------|
| **社区规模** | ⭐⭐⭐⭐⭐ 非常大 | ⭐⭐⭐⭐ 快速增长 |
| **文档质量** | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐ 良好 |
| **第三方集成** | ⭐⭐⭐⭐⭐ 广泛 | ⭐⭐⭐⭐ 逐步完善 |
| **Better Auth** | ✅ 官方支持 | ✅ 官方支持 |
| **Edge Runtime** | ⚠️ 需要 Data Proxy | ✅ 原生支持 |

---

## ⚖️ 迁移收益 vs 成本

### ✅ 收益

1. **性能提升**
   - 冷启动时间减少 ~5x
   - Bundle 大小减少 ~40x
   - 更适合 Edge/Serverless 环境

2. **SQL 控制**
   - 直接看到生成的 SQL
   - 更容易优化复杂查询
   - 复杂 JOIN 更直观

3. **类型安全**
   - Schema 用 TypeScript 定义
   - 编译时类型检查更严格
   - 与项目代码更统一

4. **Edge 兼容性**
   - 原生支持 Cloudflare Workers
   - 更适合 Vercel Edge Functions
   - 无需 Data Proxy

### ❌ 成本

1. **迁移工作量**
   - ~20 个模型需要重写
   - ~38 个文件需要修改
   - 所有查询语法需要转换

2. **学习成本**
   - 团队需要学习 Drizzle API
   - 查询语法完全不同
   - 关联处理方式不同

3. **功能差异**
   - Drizzle 没有 Prisma 的嵌套写入
   - 事务语法不同
   - Studio 功能相对较弱

4. **Better Auth 适配**
   - 需要更换适配器
   - 需要验证兼容性

---

## 🎯 迁移难点分析

### 1. 查询语法转换

```typescript
// Prisma
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  include: {
    sessions: true,
    accounts: true,
  },
})

// Drizzle
const users = await db.query.user.findMany({
  where: eq(user.role, 'admin'),
  with: {
    sessions: true,
    accounts: true,
  },
})
```

### 2. 事务处理

```typescript
// Prisma
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: {...} })
  await tx.account.create({ data: {...} })
})

// Drizzle
await db.transaction(async (tx) => {
  await tx.insert(user).values({...})
  await tx.insert(account).values({...})
})
```

### 3. 嵌套创建（Prisma 特有）

```typescript
// Prisma - 嵌套创建
await prisma.navGroup.create({
  data: {
    title: 'Dashboard',
    navItems: {
      create: [
        { title: 'Overview', url: '/admin' },
        { title: 'Users', url: '/admin/users' },
      ],
    },
  },
})

// Drizzle - 需要分步创建
const [group] = await db.insert(navGroup).values({ title: 'Dashboard' }).returning()
await db.insert(navItem).values([
  { title: 'Overview', url: '/admin', navGroupId: group.id },
  { title: 'Users', url: '/admin/users', navGroupId: group.id },
])
```

### 4. Better Auth 适配器

```typescript
// Prisma (当前)
import { prismaAdapter } from 'better-auth/adapters/prisma'
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
})

// Drizzle (迁移后)
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
})
```

---

## 📋 迁移工作量估算

### 文件修改清单

| 类别 | 文件数 | 工作量 |
|------|--------|--------|
| Schema 定义 | 1 → 多个 | ⭐⭐⭐ 中等 |
| 数据库连接 | 1 | ⭐ 简单 |
| API 路由 | ~15 | ⭐⭐⭐⭐ 较大 |
| Service 层 | ~10 | ⭐⭐⭐⭐ 较大 |
| Seed 文件 | 1 | ⭐⭐ 简单 |
| Better Auth | 1 | ⭐⭐ 简单 |
| **总计** | ~30 | **⭐⭐⭐⭐ 3-5 天** |

### 迁移步骤

1. **准备阶段** (0.5 天)
   - 安装 Drizzle 依赖
   - 配置 drizzle.config.ts
   - 设置 drizzle-kit

2. **Schema 迁移** (1 天)
   - 将 Prisma schema 转换为 Drizzle
   - 定义关联关系
   - 生成类型

3. **数据库适配** (0.5 天)
   - 更新 db.ts
   - 配置 LibSQL 适配器
   - 测试连接

4. **Service 层迁移** (1-2 天)
   - 重写所有查询
   - 转换事务
   - 处理关联

5. **Better Auth 迁移** (0.5 天)
   - 更换适配器
   - 测试认证流程

6. **测试和调试** (0.5-1 天)
   - 端到端测试
   - 修复问题

---

## 🤔 我的建议

### ❌ **暂时不建议迁移**

**理由**:

1. **投入产出比不高**
   - 迁移需要 3-5 天的工作量
   - 项目已经稳定运行
   - 性能收益在当前规模下不明显

2. **Prisma 7.x 已经很优秀**
   - 新版本性能已大幅改善
   - Prisma Studio 比 Drizzle Studio 更成熟
   - 社区和文档更完善

3. **当前架构已经够好**
   - 刚完成 ServerFn 迁移
   - 代码结构清晰
   - 不适合同时进行多个大型重构

4. **风险较高**
   - 查询语法完全不同
   - 可能引入难以发现的 bug
   - Better Auth 适配需要验证

### ✅ **建议迁移的场景**

如果以下情况成立，可以考虑迁移：

1. **部署到 Edge Runtime**
   - Cloudflare Workers
   - Vercel Edge Functions
   - Deno Deploy

2. **需要极致性能**
   - 高并发场景
   - 冷启动敏感（Serverless）
   - Bundle 大小敏感

3. **需要精细 SQL 控制**
   - 复杂的 JOIN 查询
   - 自定义优化需求
   - 遗留数据库集成

4. **新项目启动**
   - 从头开始更容易
   - 没有迁移成本

---

## 🔄 折中方案

如果你真的想尝试 Drizzle，可以考虑：

### 方案 1：新模块使用 Drizzle
```typescript
// 保持 Prisma 处理核心模块
// 新的题库模块使用 Drizzle
import { drizzle } from 'drizzle-orm/libsql'
import { prisma } from '@/shared/lib/db'

// 两者共存
```

### 方案 2：等待更好的时机
- 等 Drizzle Studio 更成熟
- 等 Prisma → Drizzle 迁移工具出现
- 等项目有明确的 Edge 部署需求

---

## 📊 最终评估

| 维度 | 评分 | 说明 |
|------|------|------|
| **必要性** | ⭐⭐ 2/5 | 当前没有明确需求 |
| **收益** | ⭐⭐⭐ 3/5 | 性能提升，但规模不明显 |
| **成本** | ⭐⭐⭐⭐ 4/5 | 工作量较大（3-5天） |
| **风险** | ⭐⭐⭐ 3/5 | 可能引入问题 |
| **时机** | ⭐⭐ 2/5 | 刚完成其他重构 |

**综合建议**: ❌ 暂不迁移，保持现有 Prisma 架构

---

## 🎯 如果坚持要迁移

### 快速开始

```bash
# 安装依赖
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit

# 创建配置
# drizzle.config.ts
```

### Schema 示例

```typescript
// src/db/schema/user.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  role: text('role'),
  // ...
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))
```

### 迁移命令

```bash
# 生成迁移
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit migrate

# 启动 Studio
npx drizzle-kit studio
```

---

## 📝 总结

**当前阶段不建议迁移到 Drizzle**。

- ✅ Prisma 7.x 已经够好
- ✅ 项目稳定运行
- ✅ 刚完成 ServerFn 重构
- ❌ 迁移工作量大（3-5天）
- ❌ 没有明确的 Edge 部署需求

**建议**：继续使用 Prisma，在以下情况再考虑迁移：
1. 需要部署到 Edge Runtime
2. 遇到明确的性能瓶颈
3. 开始新的独立项目
