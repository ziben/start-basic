# RBAC Phase 4: 权限系统实施计划

## 📊 目标概述

实现完整的权限管理系统，包括：
1. **Permission 管理** - 权限的 CRUD 操作
2. **RolePermission 分配** - 为角色分配权限和数据范围
3. **权限检查** - 在 API 层面验证用户权限

---

## 🗄️ 数据模型回顾

### **Permission（权限）**
```prisma
model Permission {
  id          String   @id @default(cuid())
  resource    String   // 资源，如 'user', 'department'
  action      String   // 操作，如 'create', 'read', 'update', 'delete'
  name        String   @unique // 组合名称，如 'user:create'
  label       String   // 显示名称
  description String?
  
  rolePermissions RolePermission[]
  fieldPermissions FieldPermission[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### **RolePermission（角色权限）**
```prisma
model RolePermission {
  id           String    @id @default(cuid())
  roleId       String
  permissionId String
  
  // 数据范围
  dataScope    DataScope @default(SELF)
  
  // 时间限制
  validFrom    DateTime?
  validUntil   DateTime?
  timeRanges   Json?     // 时间段限制
  
  role         SystemRole @relation(...)
  permission   Permission @relation(...)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum DataScope {
  ALL           // 所有数据
  ORG           // 本组织
  DEPT          // 本部门
  DEPT_AND_SUB  // 本部门及子部门
  SELF          // 仅自己
}
```

---

## 📝 实施步骤

### **Part 1: Permission 管理**

#### **Step 1.1: Permission Service**

**文件：** `shared/services/permission.service.ts`

```typescript
import prisma from '@/shared/lib/db'

export const PermissionService = {
  /**
   * 获取所有权限
   */
  async getAll(options?: {
    resource?: string
    action?: string
  }) {
    const where: any = {}
    
    if (options?.resource) {
      where.resource = options.resource
    }
    if (options?.action) {
      where.action = options.action
    }
    
    return await prisma.permission.findMany({
      where,
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })
  },
  
  /**
   * 获取权限列表（分页）
   */
  async getList(input: {
    page?: number
    pageSize?: number
    filter?: string
    resource?: string
  }) {
    const { page = 1, pageSize = 20, filter, resource } = input
    
    const where: any = {}
    
    if (filter) {
      where.OR = [
        { name: { contains: filter } },
        { label: { contains: filter } },
        { resource: { contains: filter } },
      ]
    }
    
    if (resource) {
      where.resource = resource
    }
    
    const [total, items] = await Promise.all([
      prisma.permission.count({ where }),
      prisma.permission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      })
    ])
    
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * 创建权限
   */
  async create(data: {
    resource: string
    action: string
    label: string
    description?: string
  }) {
    const name = `${data.resource}:${data.action}`
    
    // 检查是否已存在
    const existing = await prisma.permission.findUnique({
      where: { name }
    })
    
    if (existing) {
      throw new Error('权限已存在')
    }
    
    return await prisma.permission.create({
      data: {
        ...data,
        name
      }
    })
  },
  
  /**
   * 更新权限
   */
  async update(id: string, data: {
    label?: string
    description?: string | null
  }) {
    return await prisma.permission.update({
      where: { id },
      data
    })
  },
  
  /**
   * 删除权限
   */
  async delete(id: string) {
    // 检查是否被使用
    const rolePermCount = await prisma.rolePermission.count({
      where: { permissionId: id }
    })
    
    if (rolePermCount > 0) {
      throw new Error('权限正在被使用，无法删除')
    }
    
    await prisma.permission.delete({
      where: { id }
    })
    
    return { success: true, id }
  }
}
```

#### **Step 1.2: Permission Server Functions**

**文件：** `shared/server-fns/permission.fn.ts`

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'

const ListPermissionsSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  filter: z.string().optional(),
  resource: z.string().optional(),
})

const CreatePermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
})

const UpdatePermissionSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  description: z.string().nullable().optional(),
})

export const getPermissionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: z.infer<typeof ListPermissionsSchema>) => 
    data ? ListPermissionsSchema.parse(data) : {}
  )
  .handler(async ({ data }) => {
    await requireAdmin('ListPermissions')
    const { PermissionService } = await import('../services/permission.service')
    return PermissionService.getList(data)
  })

export const getAllPermissionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: { resource?: string; action?: string }) => data || {})
  .handler(async ({ data }) => {
    await requireAdmin('ListAllPermissions')
    const { PermissionService } = await import('../services/permission.service')
    return PermissionService.getAll(data)
  })

export const createPermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreatePermissionSchema>) => 
    CreatePermissionSchema.parse(data)
  )
  .handler(async ({ data }) => {
    await requireAdmin('CreatePermission')
    const { PermissionService } = await import('../services/permission.service')
    return PermissionService.create(data)
  })

export const updatePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdatePermissionSchema>) => 
    UpdatePermissionSchema.parse(data)
  )
  .handler(async ({ data }) => {
    await requireAdmin('UpdatePermission')
    const { PermissionService } = await import('../services/permission.service')
    const { id, ...updateData } = data
    return PermissionService.update(id, updateData)
  })

export const deletePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error('ID 不能为空')
    return data
  })
  .handler(async ({ data }) => {
    await requireAdmin('DeletePermission')
    const { PermissionService } = await import('../services/permission.service')
    return PermissionService.delete(data.id)
  })
```

#### **Step 1.3: Permission Hooks**

**文件：** `shared/hooks/use-permission-api.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getPermissionsFn,
  getAllPermissionsFn,
  createPermissionFn,
  updatePermissionFn,
  deletePermissionFn,
} from '../server-fns/permission.fn'

export const PERMISSIONS_QUERY_KEY = ['permissions']

export function usePermissions(params?: {
  page?: number
  pageSize?: number
  filter?: string
  resource?: string
}) {
  return useQuery({
    queryKey: [...PERMISSIONS_QUERY_KEY, params],
    queryFn: async () => {
      return await getPermissionsFn({ data: params })
    }
  })
}

export function useAllPermissions(options?: {
  resource?: string
  action?: string
}) {
  return useQuery({
    queryKey: [...PERMISSIONS_QUERY_KEY, 'all', options],
    queryFn: async () => {
      return await getAllPermissionsFn({ data: options })
    }
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      resource: string
      action: string
      label: string
      description?: string
    }) => {
      return await createPermissionFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
      toast.success('权限创建成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败')
    }
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      id: string
      label?: string
      description?: string | null
    }) => {
      return await updatePermissionFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
      toast.success('权限更新成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    }
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await deletePermissionFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
      toast.success('权限删除成功')
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    }
  })
}
```

---

### **Part 2: RolePermission 分配**

#### **Step 2.1: RolePermission Service**

**文件：** `shared/services/role-permission.service.ts`

```typescript
import prisma from '@/shared/lib/db'

export const RolePermissionService = {
  /**
   * 获取角色的权限列表
   */
  async getRolePermissions(roleId: string) {
    return await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },
  
  /**
   * 为角色分配权限
   */
  async assignPermissions(
    roleId: string,
    permissions: Array<{
      permissionId: string
      dataScope?: string
      validFrom?: Date
      validUntil?: Date
    }>
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. 删除现有权限
      await tx.rolePermission.deleteMany({
        where: { roleId }
      })
      
      // 2. 创建新权限
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map(p => ({
            roleId,
            permissionId: p.permissionId,
            dataScope: p.dataScope || 'SELF',
            validFrom: p.validFrom,
            validUntil: p.validUntil,
          }))
        })
      }
      
      return { success: true }
    })
  },
  
  /**
   * 更新单个权限的数据范围
   */
  async updateDataScope(
    rolePermissionId: string,
    dataScope: string
  ) {
    return await prisma.rolePermission.update({
      where: { id: rolePermissionId },
      data: { dataScope }
    })
  }
}
```

---

### **Part 3: 权限检查中间件**

#### **Step 3.1: 权限验证函数**

**文件：** `shared/lib/permission-check.ts`

```typescript
import prisma from '@/shared/lib/db'

/**
 * 检查用户是否有指定权限
 */
export async function checkPermission(
  userId: string,
  permissionName: string,
  options?: {
    organizationId?: string
    departmentId?: string
  }
): Promise<boolean> {
  // 1. 获取用户的成员关系
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId: options?.organizationId
    },
    include: {
      systemRole: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })
  
  if (!member || !member.systemRole) {
    return false
  }
  
  // 2. 检查角色是否有该权限
  const hasPermission = member.systemRole.rolePermissions.some(
    rp => rp.permission.name === permissionName
  )
  
  return hasPermission
}

/**
 * 要求用户有指定权限（用于 ServerFn）
 */
export async function requirePermission(
  userId: string,
  permissionName: string,
  options?: {
    organizationId?: string
    departmentId?: string
  }
) {
  const hasPermission = await checkPermission(userId, permissionName, options)
  
  if (!hasPermission) {
    throw new Error(`权限不足：需要 ${permissionName} 权限`)
  }
}
```

---

## 📋 实施清单

### **Part 1: Permission 管理** ⚠️
- [ ] Permission Service
- [ ] Permission Server Functions
- [ ] Permission Hooks
- [ ] Permission 管理页面（可选）

### **Part 2: RolePermission 分配** ⚠️
- [ ] RolePermission Service
- [ ] RolePermission Server Functions
- [ ] 角色权限分配界面
- [ ] 数据范围选择器

### **Part 3: 权限检查** ⚠️
- [ ] 权限验证函数
- [ ] 集成到现有 API
- [ ] 测试权限检查

---

## 🎯 优先级

### **高优先级（核心功能）：**
1. ✅ Permission Service + API
2. ✅ RolePermission Service + API
3. ✅ 基础权限检查函数

### **中优先级（管理界面）：**
4. ⚠️ 角色权限分配界面
5. ⚠️ Permission 管理页面

### **低优先级（高级功能）：**
6. ⚠️ 时间限制功能
7. ⚠️ 数据范围过滤
8. ⚠️ 权限审计日志

---

## 📝 下一步

开始实施 Part 1: 创建 Permission Service
