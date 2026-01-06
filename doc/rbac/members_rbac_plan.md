# Members 模块 RBAC 集成实施计划

## 📊 当前状态分析

### **现有 Schema（member）**
```typescript
{
  id: string
  userId: string
  organizationId: string
  role: string              // ⚠️ 字符串角色（需要扩展）
  createdAt: string
  // 关联数据
  user: User
  organization: Organization
}
```

### **数据库 Schema（Member 表）**
```prisma
model Member {
  id             String
  organizationId String
  userId         String
  role           String       // 保留：向后兼容
  
  // 新增字段（已在数据库中）
  systemRoleId   String?
  systemRole     SystemRole?
  departmentId   String?
  department     Department?
  
  createdAt      DateTime
}
```

---

## 🎯 实施目标

### **1. 扩展 TypeScript Schema**
添加 RBAC 相关字段到前端 Schema

### **2. 更新成员表单**
- 添加部门选择器
- 添加 SystemRole 选择器
- 保留字符串 role（向后兼容）

### **3. 更新列表展示**
- 显示部门信息
- 显示 SystemRole
- 显示角色标签

### **4. 创建部门选择器组件**
可复用的部门选择组件

---

## 📝 实施步骤

### **Step 1: 扩展 Schema**

**文件：** `members/data/schema.ts`

```typescript
export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  role: z.string(),
  
  // 新增 RBAC 字段
  systemRoleId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  
  createdAt: z.string(),
  
  // 关联数据
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  organization: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  
  // 新增关联
  systemRole: z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
  }).nullable().optional(),
  
  department: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }).nullable().optional(),
})
```

### **Step 2: 创建部门选择器组件**

**文件：** `shared/components/department-selector.tsx`

```tsx
interface DepartmentSelectorProps {
  organizationId: string
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
}

export function DepartmentSelector({
  organizationId,
  value,
  onValueChange,
  placeholder = '选择部门'
}: DepartmentSelectorProps) {
  const { departments } = useDepartmentsQuery({ organizationId })
  
  return (
    <Select 
      value={value || '__none__'} 
      onValueChange={(v) => onValueChange(v === '__none__' ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='__none__'>无</SelectItem>
        {departments.map(dept => (
          <SelectItem key={dept.id} value={dept.id}>
            {'  '.repeat(dept.level - 1)}{dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### **Step 3: 创建角色选择器组件**

**文件：** `shared/components/system-role-selector.tsx`

```tsx
interface SystemRoleSelectorProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  scope?: 'GLOBAL' | 'ORG' | 'DEPT'
}

export function SystemRoleSelector({
  value,
  onValueChange,
  scope
}: SystemRoleSelectorProps) {
  const { data: roles } = useQuery({
    queryKey: ['system-roles', scope],
    queryFn: async () => {
      // 调用 API 获取角色列表
      return await getSystemRolesFn({ data: { scope } })
    }
  })
  
  return (
    <Select 
      value={value || '__none__'} 
      onValueChange={(v) => onValueChange(v === '__none__' ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder='选择角色' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='__none__'>无</SelectItem>
        {roles?.map(role => (
          <SelectItem key={role.id} value={role.id}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### **Step 4: 更新成员表单**

**文件：** `members/components/member-mutate-dialog.tsx`

添加字段：
1. 部门选择（DepartmentSelector）
2. SystemRole 选择（SystemRoleSelector）
3. 保留原有 role 字段（向后兼容）

### **Step 5: 更新表格列**

**文件：** `members/components/members-columns.tsx`

添加列：
1. 部门列 - 显示部门名称
2. 角色列 - 显示 SystemRole label 或 role

### **Step 6: 更新 Server Functions**

**文件：** `shared/server-fns/member.fn.ts`

确保 CRUD 操作支持新字段：
- createMemberFn
- updateMemberFn

---

## 🔧 具体改动清单

### **需要修改的文件：**

1. ✅ `members/data/schema.ts` - 扩展 Schema
2. ✅ `shared/components/department-selector.tsx` - 新建
3. ✅ `shared/components/system-role-selector.tsx` - 新建
4. ✅ `members/components/member-mutate-dialog.tsx` - 添加字段
5. ✅ `members/components/members-columns.tsx` - 添加列
6. ⚠️ `shared/server-fns/member.fn.ts` - 检查并更新
7. ⚠️ `shared/services/member.service.ts` - 检查并更新

### **需要创建的 API（如果不存在）：**

1. `getSystemRolesFn` - 获取系统角色列表
2. 确保 Member CRUD 支持新字段

---

## ⚠️ 向后兼容性

### **保持兼容的策略：**

1. **保留 role 字段**
   - 继续支持字符串角色
   - 作为 fallback

2. **优先使用 SystemRole**
   - 如果有 systemRoleId，优先显示
   - 否则显示 role 字符串

3. **渐进式迁移**
   - 新成员使用 SystemRole
   - 旧成员保持 role
   - 提供迁移工具（可选）

---

## 📊 预期效果

### **表单增强：**
```
成员表单：
├─ 用户选择 *
├─ 组织选择 *
├─ 部门选择      ← 新增
├─ 系统角色      ← 新增
└─ 角色（字符串） ← 保留
```

### **列表展示：**
```
成员列表：
├─ 用户名
├─ 邮箱
├─ 组织
├─ 部门         ← 新增
├─ 角色         ← 增强（显示 SystemRole）
└─ 创建时间
```

---

## 🚀 实施优先级

### **高优先级（核心功能）：**
1. ✅ 扩展 Schema
2. ✅ 创建部门选择器
3. ✅ 更新成员表单
4. ✅ 更新列表展示

### **中优先级（增强功能）：**
5. ⚠️ 创建 SystemRole 选择器
6. ⚠️ 添加角色筛选
7. ⚠️ 批量分配部门/角色

### **低优先级（可选）：**
8. ⚠️ 数据迁移工具
9. ⚠️ 角色权限预览
10. ⚠️ 部门成员统计

---

## ✅ 验收标准

1. ✅ 创建成员时可以选择部门
2. ✅ 创建成员时可以选择 SystemRole
3. ✅ 列表中显示部门信息
4. ✅ 列表中显示角色信息
5. ✅ 编辑成员时可以修改部门和角色
6. ✅ 向后兼容现有数据
7. ✅ 部门选择器支持层级显示

---

## 📝 下一步

开始实施 Step 1：扩展 Schema
