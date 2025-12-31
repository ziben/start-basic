# 架构重构：从 API 路由迁移到 ServerFn + Service 层

## 📋 概述

将项目从 REST API 路由 (`/api/admin/*`) 迁移到 TanStack Start 的 `createServerFn` 模式，业务逻辑抽象到 Service 层。

## ✅ 可行性分析

### 优点
| 方面 | API 路由 | ServerFn |
|------|---------|----------|
| **类型安全** | ⚠️ 需要手动定义 | ✅ 端到端类型推断 |
| **代码量** | 多（路由文件+API客户端） | ✅ 少（一个函数） |
| **调用方式** | fetch + URL | ✅ 直接函数调用 |
| **错误处理** | HTTP 状态码 | ✅ 原生 try/catch |
| **认证** | 中间件 | ✅ 函数内处理 |
| **SSR 支持** | ⚠️ 需要额外处理 | ✅ 原生支持 |
| **代码复用** | ⚠️ 分散 | ✅ Service 层集中 |

### 缺点/限制
| 问题 | 解决方案 |
|------|---------|
| 第三方需要调用 | 保留必要的 API 端点 |
| Webhook 接收 | 保留 webhook 路由 |
| 文件上传 | 使用专用上传路由 |

## 🏗️ 推荐的新架构

```
src/
├── modules/
│   └── system-admin/
│       ├── shared/
│       │   ├── services/           # Service 层（业务逻辑）
│       │   │   ├── navgroup.service.ts
│       │   │   ├── navitem.service.ts
│       │   │   ├── user.service.ts
│       │   │   └── role.service.ts
│       │   │
│       │   └── server-fns/         # ServerFn 层（API 替代）
│       │       ├── navgroup.fn.ts
│       │       ├── navitem.fn.ts
│       │       ├── user.fn.ts
│       │       └── role.fn.ts
│       │
│       └── features/
│           └── navigation/
│               └── navgroup/
│                   └── hooks/
│                       └── use-navgroup.ts  # 使用 ServerFn
```

## 📝 实现示例

### 1. Service 层 - 纯业务逻辑

```typescript
// src/modules/system-admin/shared/services/navgroup.service.ts

import prisma from '@/shared/lib/db'

// Prisma 事务客户端类型
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * NavGroup Service - 纯业务逻辑，不涉及认证
 */
export const NavGroupService = {
  /**
   * 获取所有导航组
   */
  async getAll(scope?: 'APP' | 'ADMIN') {
    return prisma.navGroup.findMany({
      where: scope ? { scope } : undefined,
      orderBy: { orderIndex: 'asc' },
      include: {
        navItems: {
          orderBy: { orderIndex: 'asc' },
        },
        roleNavGroups: {
          include: {
            systemRole: true,
          },
        },
      },
    })
  },

  /**
   * 获取单个导航组
   */
  async getById(id: string) {
    const navGroup = await prisma.navGroup.findUnique({
      where: { id },
      include: {
        navItems: { orderBy: { orderIndex: 'asc' } },
        roleNavGroups: {
          include: { systemRole: true },
        },
      },
    })
    
    if (!navGroup) {
      throw new Error('导航组不存在')
    }
    
    return navGroup
  },

  /**
   * 创建导航组
   */
  async create(data: {
    title: string
    scope?: 'APP' | 'ADMIN'
    orderIndex?: number
    roles?: string[]
  }) {
    // 获取最大 orderIndex
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const lastNavGroup = await prisma.navGroup.findFirst({
        orderBy: { orderIndex: 'desc' },
      })
      orderIndex = lastNavGroup ? lastNavGroup.orderIndex + 1 : 0
    }

    return prisma.$transaction(async (tx: TransactionClient) => {
      // 创建导航组
      const group = await tx.navGroup.create({
        data: {
          title: data.title,
          scope: data.scope ?? 'APP',
          orderIndex,
        },
      })

      // 创建角色关联
      if (data.roles && data.roles.length > 0) {
        const systemRoles = await tx.systemRole.findMany({
          where: { name: { in: data.roles } },
        })

        if (systemRoles.length > 0) {
          await tx.roleNavGroup.createMany({
            data: systemRoles.map((role) => ({
              roleId: role.id,
              navGroupId: group.id,
            })),
          })
        }
      }

      // 返回完整对象
      return tx.navGroup.findUnique({
        where: { id: group.id },
        include: {
          navItems: { orderBy: { orderIndex: 'asc' } },
          roleNavGroups: {
            include: { systemRole: true },
          },
        },
      })
    })
  },

  /**
   * 更新导航组
   */
  async update(id: string, data: {
    title?: string
    scope?: 'APP' | 'ADMIN'
    orderIndex?: number
    roles?: string[]
  }) {
    return prisma.$transaction(async (tx: TransactionClient) => {
      // 更新基本信息
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.scope !== undefined) updateData.scope = data.scope
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

      await tx.navGroup.update({
        where: { id },
        data: updateData,
      })

      // 更新角色关联
      if (data.roles !== undefined) {
        await tx.roleNavGroup.deleteMany({
          where: { navGroupId: id },
        })

        if (data.roles.length > 0) {
          const systemRoles = await tx.systemRole.findMany({
            where: { name: { in: data.roles } },
          })

          if (systemRoles.length > 0) {
            await tx.roleNavGroup.createMany({
              data: systemRoles.map((role) => ({
                roleId: role.id,
                navGroupId: id,
              })),
            })
          }
        }
      }

      return tx.navGroup.findUnique({
        where: { id },
        include: {
          navItems: { orderBy: { orderIndex: 'asc' } },
          roleNavGroups: {
            include: { systemRole: true },
          },
        },
      })
    })
  },

  /**
   * 删除导航组
   */
  async delete(id: string) {
    const navGroup = await prisma.navGroup.findUnique({
      where: { id },
    })

    if (!navGroup) {
      throw new Error('导航组不存在')
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.roleNavGroup.deleteMany({ where: { navGroupId: id } })
      await tx.userRoleNavGroup.deleteMany({ where: { navGroupId: id } })
      await tx.navGroup.delete({ where: { id } })
    })

    return { success: true, id }
  },

  /**
   * 更新排序
   */
  async updateOrder(groupIds: string[]) {
    await prisma.$transaction(
      groupIds.map((id, index) =>
        prisma.navGroup.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    )
    return { success: true }
  },
}
```

### 2. ServerFn 层 - 处理认证和调用 Service

```typescript
// src/modules/system-admin/shared/server-fns/navgroup.fn.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Schema 定义
const CreateNavGroupSchema = z.object({
  title: z.string().min(1),
  scope: z.enum(['APP', 'ADMIN']).optional(),
  orderIndex: z.number().optional(),
  roles: z.array(z.string()).optional(),
})

const UpdateNavGroupSchema = z.object({
  title: z.string().optional(),
  scope: z.enum(['APP', 'ADMIN']).optional(),
  orderIndex: z.number().optional(),
  roles: z.array(z.string()).optional(),
})

/**
 * 获取当前用户并验证管理员权限
 */
async function requireAdmin() {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { auth } = await import('~/modules/identity/shared/lib/auth')
  
  const { headers } = getRequest()!
  const session = await auth.api.getSession({ headers })
  
  if (!session?.user) {
    throw new Error('未登录')
  }
  
  if (!['admin', 'superadmin'].includes(session.user.role || '')) {
    throw new Error('无权限')
  }
  
  return session.user
}

// ============ ServerFn 定义 ============

/**
 * 获取导航组列表
 */
export const getNavGroups = createServerFn({ method: 'GET' })
  .validator((data: { scope?: 'APP' | 'ADMIN' }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    return NavGroupService.getAll(data?.scope)
  })

/**
 * 获取单个导航组
 */
export const getNavGroup = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    return NavGroupService.getById(data.id)
  })

/**
 * 创建导航组
 */
export const createNavGroup = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateNavGroupSchema>) => 
    CreateNavGroupSchema.parse(data)
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    return NavGroupService.create(data)
  })

/**
 * 更新导航组
 */
export const updateNavGroup = createServerFn({ method: 'POST' })
  .validator((data: { id: string } & z.infer<typeof UpdateNavGroupSchema>) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    const { id, ...updateData } = data
    return NavGroupService.update(id, updateData)
  })

/**
 * 删除导航组
 */
export const deleteNavGroup = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    return NavGroupService.delete(data.id)
  })

/**
 * 更新排序
 */
export const updateNavGroupOrder = createServerFn({ method: 'POST' })
  .validator((data: { groupIds: string[] }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { NavGroupService } = await import('../services/navgroup.service')
    return NavGroupService.updateOrder(data.groupIds)
  })
```

### 3. Hooks 层 - 使用 ServerFn

```typescript
// src/modules/system-admin/features/navigation/navgroup/hooks/use-navgroup.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNavGroups,
  getNavGroup,
  createNavGroup,
  updateNavGroup,
  deleteNavGroup,
  updateNavGroupOrder,
} from '~/modules/system-admin/shared/server-fns/navgroup.fn'

/**
 * 获取导航组列表
 */
export function useNavGroups(scope?: 'APP' | 'ADMIN') {
  return useQuery({
    queryKey: ['navgroups', scope],
    queryFn: () => getNavGroups({ data: { scope } }),
  })
}

/**
 * 获取单个导航组
 */
export function useNavGroup(id: string) {
  return useQuery({
    queryKey: ['navgroup', id],
    queryFn: () => getNavGroup({ data: { id } }),
    enabled: !!id,
  })
}

/**
 * 创建导航组
 */
export function useCreateNavGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createNavGroup>[0]['data']) =>
      createNavGroup({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navgroups'] })
    },
  })
}

/**
 * 更新导航组
 */
export function useUpdateNavGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof updateNavGroup>[0]['data']) =>
      updateNavGroup({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['navgroups'] })
      queryClient.invalidateQueries({ queryKey: ['navgroup', variables.id] })
    },
  })
}

/**
 * 删除导航组
 */
export function useDeleteNavGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteNavGroup({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navgroups'] })
    },
  })
}

/**
 * 更新排序
 */
export function useUpdateNavGroupOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupIds: string[]) => updateNavGroupOrder({ data: { groupIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navgroups'] })
    },
  })
}
```

### 4. 组件中使用

```tsx
// 使用示例
import { useNavGroups, useCreateNavGroup, useDeleteNavGroup } from './hooks/use-navgroup'

function NavGroupList() {
  const { data: navGroups, isLoading } = useNavGroups('ADMIN')
  const createMutation = useCreateNavGroup()
  const deleteMutation = useDeleteNavGroup()
  
  const handleCreate = async () => {
    await createMutation.mutateAsync({
      title: '新导航组',
      scope: 'ADMIN',
      roles: ['admin'],
    })
  }
  
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <ul>
      {navGroups?.map(group => (
        <li key={group.id}>
          {group.title}
          <button onClick={() => handleDelete(group.id)}>删除</button>
        </li>
      ))}
      <button onClick={handleCreate}>创建</button>
    </ul>
  )
}
```

## 🚀 迁移步骤

### 阶段 1：创建基础设施
1. 创建 `services/` 目录
2. 创建 `server-fns/` 目录
3. 创建认证辅助函数 `requireAdmin()`

### 阶段 2：迁移 NavGroup
1. 创建 `navgroup.service.ts` - 从 API 路由提取业务逻辑
2. 创建 `navgroup.fn.ts` - 使用 ServerFn 封装
3. 更新 hooks - 从 API 调用改为 ServerFn 调用
4. 测试功能正常后，删除旧的 API 路由

### 阶段 3：迁移其他模块
按以下顺序迁移：
- NavItem
- User
- Role
- Session
- Organization
- Translation
- Log

### 阶段 4：清理
1. 删除 `/api/admin/` 目录
2. 删除 `navgroup-api.ts` 等 API 客户端文件
3. 更新文档

## 📊 对比总结

### 迁移前
```
组件 
  → navgroup-api.ts (fetch) 
  → /api/admin/navgroup (路由) 
  → 业务逻辑 (内嵌)
  → Prisma
```

### 迁移后
```
组件 
  → use-navgroup.ts (hook)
  → navgroup.fn.ts (ServerFn)
  → navgroup.service.ts (业务逻辑)
  → Prisma
```

## ✅ 结论

**完全可行！** 这种架构有以下优势：
1. ✅ 更好的类型安全
2. ✅ 更少的代码量
3. ✅ 更清晰的分层
4. ✅ 更容易测试
5. ✅ 更好的 SSR 支持

推荐按模块逐步迁移，每次迁移一个模块并测试后再继续。
