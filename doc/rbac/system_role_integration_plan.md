# SystemRole 集成实施计划

## 📊 当前状态

### **数据库 Schema（已有）**
```prisma
model SystemRole {
  id          String   @id @default(cuid())
  name        String   @unique  // admin, org_admin, dept_admin, user
  label       String              // 显示名称
  description String?
  scope       RoleScope           // GLOBAL, ORG, DEPT
  
  // 关联
  members         Member[]
  rolePermissions RolePermission[]
  crossOrgAccess  CrossOrgAccess[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum RoleScope {
  GLOBAL
  ORG
  DEPT
}
```

### **种子数据（已创建）**
- ✅ admin (GLOBAL)
- ✅ org_admin (ORG)
- ✅ dept_admin (DEPT)
- ✅ user (GLOBAL)

### **现有问题**
- ⚠️ 没有 SystemRole API（获取角色列表）
- ⚠️ Members 表单使用硬编码的字符串角色
- ⚠️ 没有 SystemRole 选择器组件

---

## 🎯 实施目标

### **1. 创建 SystemRole API**
- 获取所有系统角色
- 按 scope 筛选
- 返回格式化数据

### **2. 创建 SystemRole 选择器**
- 可复用组件
- 支持按 scope 筛选
- 显示角色 label 和描述

### **3. 更新 Members 表单**
- 使用 SystemRole 选择器
- 保留字符串 role 作为 fallback
- 双字段支持（向后兼容）

### **4. 更新 Members 列表**
- 优先显示 SystemRole label
- Fallback 到字符串 role
- 不同 scope 的视觉区分

---

## 📝 实施步骤

### **Step 1: 创建 SystemRole Service**

**文件：** `shared/services/system-role.service.ts`

```typescript
export class SystemRoleService {
  /**
   * 获取所有系统角色
   */
  static async getAll(options?: {
    scope?: 'GLOBAL' | 'ORG' | 'DEPT'
  }) {
    const where: any = {}
    
    if (options?.scope) {
      where.scope = options.scope
    }
    
    const roles = await db.systemRole.findMany({
      where,
      orderBy: [
        { scope: 'asc' },
        { name: 'asc' }
      ]
    })
    
    return roles
  }
  
  /**
   * 根据ID获取角色
   */
  static async getById(id: string) {
    return await db.systemRole.findUnique({
      where: { id }
    })
  }
}
```

### **Step 2: 创建 SystemRole Server Function**

**文件：** `shared/server-fns/system-role.fn.ts`

```typescript
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { SystemRoleService } from '../services/system-role.service'

const getSystemRolesInputSchema = z.object({
  scope: z.enum(['GLOBAL', 'ORG', 'DEPT']).optional()
})

export const getSystemRolesFn = createServerFn({ method: 'GET' })
  .validator(getSystemRolesInputSchema)
  .handler(async ({ data }) => {
    return await SystemRoleService.getAll({
      scope: data.scope
    })
  })
```

### **Step 3: 创建 SystemRole Hooks**

**文件：** `shared/hooks/use-system-roles.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSystemRolesFn } from '../server-fns/system-role.fn'

export const SYSTEM_ROLES_QUERY_KEY = ['system-roles']

export function useSystemRoles(scope?: 'GLOBAL' | 'ORG' | 'DEPT') {
  return useQuery({
    queryKey: [...SYSTEM_ROLES_QUERY_KEY, { scope }],
    queryFn: async () => {
      return await getSystemRolesFn({ data: { scope } })
    }
  })
}
```

### **Step 4: 创建 SystemRole 选择器组件**

**文件：** `shared/components/system-role-selector.tsx`

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSystemRoles } from '../hooks/use-system-roles'
import { Badge } from '@/components/ui/badge'

interface SystemRoleSelectorProps {
  value?: string | null
  onValueChange: (value: string | undefined) => void
  scope?: 'GLOBAL' | 'ORG' | 'DEPT'
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean
}

const scopeColors = {
  GLOBAL: 'bg-purple-100 text-purple-800',
  ORG: 'bg-blue-100 text-blue-800',
  DEPT: 'bg-green-100 text-green-800',
}

export function SystemRoleSelector({
  value,
  onValueChange,
  scope,
  placeholder = '选择系统角色',
  disabled = false,
  allowNone = true,
}: SystemRoleSelectorProps) {
  const { data: roles, isLoading } = useSystemRoles(scope)

  return (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onValueChange(v === '__none__' ? undefined : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? '加载中...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value='__none__'>无</SelectItem>}
        {roles?.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            <div className='flex items-center gap-2'>
              <span>{role.label}</span>
              <Badge variant='outline' className={scopeColors[role.scope]}>
                {role.scope}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### **Step 5: 更新 Member 表单**

**文件：** `members/components/member-mutate-dialog.tsx`

添加 SystemRole 字段：

```tsx
// 在 departmentId 之后添加
<FormField
  control={form.control}
  name='systemRoleId'
  render={({ field }) => (
    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
      <FormLabel className='col-span-2 text-end'>系统角色</FormLabel>
      <div className='col-span-4'>
        <SystemRoleSelector
          value={field.value}
          onValueChange={field.onChange}
        />
      </div>
      <FormMessage className='col-span-4 col-start-3' />
    </FormItem>
  )}
/>

// 保留原有的 role 字段作为 fallback
<FormField
  control={form.control}
  name='role'
  render={({ field }) => (
    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
      <FormLabel className='col-span-2 text-end'>
        角色（兼容） *
      </FormLabel>
      {/* ... 现有的 role 选择器 ... */}
    </FormItem>
  )}
/>
```

### **Step 6: 更新 Member 列表**

**文件：** `members/components/members-columns.tsx`

更新角色列显示逻辑：

```tsx
{
  accessorKey: 'role',
  header: ({ column }) => <DataTableColumnHeader column={column} title='角色' />,
  cell: ({ row }) => {
    const systemRole = row.original.systemRole
    const role = row.getValue('role') as string
    
    // 优先显示 SystemRole
    if (systemRole) {
      return (
        <div className='flex items-center gap-2'>
          <Shield className='h-4 w-4 text-muted-foreground' />
          <div className='flex flex-col'>
            <span className='font-medium'>{systemRole.label}</span>
            <Badge variant='outline' className={scopeColors[systemRole.scope]}>
              {systemRole.scope}
            </Badge>
          </div>
        </div>
      )
    }
    
    // Fallback 到字符串 role
    return (
      <div className='flex items-center gap-2'>
        <Shield className='h-4 w-4 text-muted-foreground' />
        <Badge variant='outline' className={roleColors[role] || roleColors.member}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      </div>
    )
  },
}
```

---

## 🔧 具体改动清单

### **需要创建的文件：**

1. ✅ `shared/services/system-role.service.ts` - Service 层
2. ✅ `shared/server-fns/system-role.fn.ts` - Server Function
3. ✅ `shared/hooks/use-system-roles.ts` - React Query Hook
4. ✅ `shared/components/system-role-selector.tsx` - 选择器组件

### **需要修改的文件：**

1. ✅ `members/components/member-mutate-dialog.tsx` - 添加 SystemRole 字段
2. ✅ `members/components/members-columns.tsx` - 更新显示逻辑
3. ✅ `members/data/schema.ts` - 已完成（已有 systemRoleId）

---

## ⚠️ 向后兼容策略

### **双字段支持：**

1. **systemRoleId** - 新的 RBAC 角色
   - 优先使用
   - 更细粒度的权限控制
   
2. **role** - 字符串角色（保留）
   - 向后兼容
   - 作为 fallback
   - 必填字段

### **显示优先级：**

```
IF systemRole 存在:
  显示 systemRole.label + scope badge
ELSE:
  显示 role 字符串 + 颜色 badge
```

### **表单策略：**

- 两个字段都可以填写
- systemRoleId 可选
- role 必填（向后兼容）
- 建议：新成员使用 systemRoleId

---

## 📊 预期效果

### **表单字段：**
```
成员表单：
├─ 组织 *
├─ 用户 *
├─ 部门
├─ 系统角色      ← 新增（可选）
└─ 角色（兼容）* ← 保留（必填）
```

### **列表显示：**

**有 SystemRole：**
```
[Shield图标] 组织管理员
             ORG
```

**无 SystemRole（fallback）：**
```
[Shield图标] Admin
```

---

## ✅ 验收标准

1. ✅ 可以查询系统角色列表
2. ✅ 可以按 scope 筛选角色
3. ✅ 表单中可以选择 SystemRole
4. ✅ 列表中正确显示 SystemRole
5. ✅ 向后兼容现有数据
6. ✅ SystemRole 选择器支持层级显示
7. ✅ 不同 scope 有视觉区分

---

## 🚀 实施顺序

1. **创建 Service** → 2. **创建 Server Function** → 3. **创建 Hooks** → 4. **创建选择器** → 5. **更新表单** → 6. **更新列表**

---

## 📝 下一步

开始实施 Step 1：创建 SystemRole Service
