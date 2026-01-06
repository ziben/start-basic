# RBAC 增强功能实现详解

## 1. 字段级权限

### 1.1 数据结构

```typescript
interface FieldPermission {
  resource: string    // 资源: 'user'
  field: string       // 字段: 'salary', 'phone'
  access: 'READ' | 'WRITE' | 'HIDDEN'
  condition?: object  // 可选条件
}
```

### 1.2 前端实现

```typescript
// hooks/use-field-permission.ts
export function useFieldPermission(resource: string) {
  const { user } = useAuth()
  
  const getFieldAccess = useCallback((field: string) => {
    // 获取用户对该字段的权限
    const permissions = user?.roles.flatMap(role =>
      role.permissions
        .filter(p => p.permission.resource === resource)
        .flatMap(p => p.permission.fieldPermissions || [])
    )
    
    const fieldPerm = permissions?.find(p => p.field === field)
    return fieldPerm?.access || 'HIDDEN'
  }, [user, resource])
  
  const canRead = (field: string) => {
    const access = getFieldAccess(field)
    return access === 'READ' || access === 'WRITE'
  }
  
  const canWrite = (field: string) => {
    return getFieldAccess(field) === 'WRITE'
  }
  
  return { getFieldAccess, canRead, canWrite }
}
```

### 1.3 表单字段控制

```tsx
// 使用示例
function UserForm({ user }: { user: User }) {
  const { canRead, canWrite } = useFieldPermission('user')
  
  return (
    <form>
      {/* 普通字段 - 所有人可见 */}
      <Input name="name" value={user.name} />
      
      {/* 敏感字段 - 根据权限控制 */}
      {canRead('salary') && (
        <Input 
          name="salary" 
          value={user.salary}
          disabled={!canWrite('salary')}
        />
      )}
      
      {canRead('phone') && (
        <Input 
          name="phone" 
          value={user.phone}
          disabled={!canWrite('phone')}
        />
      )}
    </form>
  )
}
```

### 1.4 表格列控制

```tsx
// 动态生成表格列
function UserTable() {
  const { canRead } = useFieldPermission('user')
  
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: 'name', header: '姓名' },
      { accessorKey: 'email', header: '邮箱' },
    ]
    
    // 根据权限添加列
    if (canRead('salary')) {
      baseColumns.push({ accessorKey: 'salary', header: '薪资' })
    }
    
    if (canRead('phone')) {
      baseColumns.push({ accessorKey: 'phone', header: '电话' })
    }
    
    return baseColumns
  }, [canRead])
  
  return <DataTable columns={columns} data={users} />
}
```

### 1.5 后端数据过滤

```typescript
// server/utils/field-filter.ts
export async function filterFields<T>(
  userId: string,
  resource: string,
  data: T | T[]
): Promise<Partial<T> | Partial<T>[]> {
  const fieldPermissions = await getUserFieldPermissions(userId, resource)
  
  const filterObject = (obj: T): Partial<T> => {
    const filtered: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const perm = fieldPermissions.find(p => p.field === key)
      
      // 如果没有权限配置，默认可见
      if (!perm || perm.access === 'READ' || perm.access === 'WRITE') {
        filtered[key] = value
      }
      // HIDDEN 字段不返回
    }
    
    return filtered
  }
  
  return Array.isArray(data) 
    ? data.map(filterObject) 
    : filterObject(data)
}
```

---

## 2. 时间段权限

### 2.1 数据结构

```typescript
interface TimeConstraint {
  validFrom?: Date      // 生效时间
  validUntil?: Date     // 失效时间
  timeRanges?: {        // 时间段限制
    day: number         // 1-7 (周一到周日)
    start: string       // "09:00"
    end: string         // "18:00"
  }[]
}
```

### 2.2 时间验证中间件

```typescript
// server/middleware/check-time-constraint.ts
export function checkTimeConstraint(permission: RolePermission): boolean {
  const now = new Date()
  
  // 检查有效期
  if (permission.validFrom && now < permission.validFrom) {
    return false
  }
  
  if (permission.validUntil && now > permission.validUntil) {
    return false
  }
  
  // 检查时间段
  if (permission.timeRanges && permission.timeRanges.length > 0) {
    const currentDay = now.getDay() || 7 // 周日为7
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const isInRange = permission.timeRanges.some(range => {
      return range.day === currentDay &&
             currentTime >= range.start &&
             currentTime <= range.end
    })
    
    if (!isInRange) {
      return false
    }
  }
  
  return true
}
```

### 2.3 前端使用

```typescript
// hooks/use-permission.ts (增强版)
export function usePermission() {
  const { user } = useAuth()
  
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    
    const rolePermissions = user.roles.flatMap(role =>
      role.permissions.filter(p => 
        p.permission.name === permission &&
        checkTimeConstraintClient(p) // 客户端时间检查
      )
    )
    
    return rolePermissions.length > 0
  }, [user])
  
  return { hasPermission }
}

function checkTimeConstraintClient(perm: RolePermission): boolean {
  const now = new Date()
  
  if (perm.validFrom && now < new Date(perm.validFrom)) {
    return false
  }
  
  if (perm.validUntil && now > new Date(perm.validUntil)) {
    return false
  }
  
  // 时间段检查...
  return true
}
```

---

## 3. 部门组织架构

### 3.1 部门管理界面

```tsx
// features/department/department-tree.tsx
export function DepartmentTree() {
  const { data: departments } = useDepartments()
  
  const buildTree = (parentId: string | null = null): Department[] => {
    return departments
      ?.filter(d => d.parentId === parentId)
      .map(dept => ({
        ...dept,
        children: buildTree(dept.id)
      })) || []
  }
  
  const tree = buildTree(null)
  
  return (
    <Tree>
      {tree.map(dept => (
        <TreeNode key={dept.id} dept={dept} />
      ))}
    </Tree>
  )
}
```

### 3.2 部门选择器

```tsx
// components/department-selector.tsx
export function DepartmentSelector({ 
  value, 
  onChange 
}: { 
  value?: string
  onChange: (deptId: string) => void 
}) {
  const { data: departments } = useDepartments()
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="选择部门" />
      </SelectTrigger>
      <SelectContent>
        {departments?.map(dept => (
          <SelectItem key={dept.id} value={dept.id}>
            {'  '.repeat(dept.level - 1)}{dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### 3.3 部门数据过滤

```typescript
// server/utils/department-filter.ts
export async function applyDepartmentFilter(
  userId: string,
  resource: string,
  baseQuery: any
) {
  const user = await getUserWithDepartment(userId)
  const dataScope = await getUserDataScope(userId, resource)
  
  switch (dataScope) {
    case 'ALL':
      return baseQuery
      
    case 'DEPT':
      // 仅本部门
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          departmentId: user.departmentId
        }
      }
      
    case 'DEPT_AND_SUB':
      // 本部门及下级部门
      const subDepts = await getSubDepartments(user.departmentId)
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          departmentId: {
            in: [user.departmentId, ...subDepts.map(d => d.id)]
          }
        }
      }
      
    case 'SELF':
      // 仅本人
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          createdById: userId
        }
      }
      
    default:
      return baseQuery
  }
}
```

---

## 4. 跨部门数据访问

### 4.1 配置界面

```tsx
// features/cross-department/cross-dept-config.tsx
export function CrossDepartmentConfig({ roleId }: { roleId: string }) {
  const { data: departments } = useDepartments()
  const [config, setConfig] = useState<CrossDepartmentAccess[]>([])
  
  const handleAddAccess = () => {
    setConfig([...config, {
      roleId,
      sourceDeptId: '',
      targetDeptId: '',
      resource: '',
      accessLevel: 'READ',
      validFrom: null,
      validUntil: null
    }])
  }
  
  return (
    <div>
      <Button onClick={handleAddAccess}>添加跨部门访问</Button>
      
      {config.map((item, index) => (
        <div key={index} className="grid grid-cols-5 gap-2">
          <DepartmentSelector 
            value={item.sourceDeptId}
            onChange={(v) => updateConfig(index, 'sourceDeptId', v)}
          />
          <span>→</span>
          <DepartmentSelector 
            value={item.targetDeptId}
            onChange={(v) => updateConfig(index, 'targetDeptId', v)}
          />
          <Select 
            value={item.resource}
            onValueChange={(v) => updateConfig(index, 'resource', v)}
          >
            <SelectItem value="user">用户</SelectItem>
            <SelectItem value="order">订单</SelectItem>
          </Select>
          <Select 
            value={item.accessLevel}
            onValueChange={(v) => updateConfig(index, 'accessLevel', v)}
          >
            <SelectItem value="READ">只读</SelectItem>
            <SelectItem value="WRITE">读写</SelectItem>
            <SelectItem value="FULL">完全控制</SelectItem>
          </Select>
        </div>
      ))}
    </div>
  )
}
```

### 4.2 跨部门访问检查

```typescript
// server/utils/cross-department-check.ts
export async function canAccessCrossDepartment(
  userId: string,
  resource: string,
  targetDeptId: string
): Promise<boolean> {
  const user = await getUserWithDepartment(userId)
  
  // 如果是同部门，直接允许
  if (user.departmentId === targetDeptId) {
    return true
  }
  
  // 检查是否有跨部门访问权限
  const crossAccess = await prisma.crossDepartmentAccess.findFirst({
    where: {
      roleId: { in: user.roles.map(r => r.id) },
      sourceDeptId: user.departmentId,
      targetDeptId: targetDeptId,
      resource: resource,
      OR: [
        { validFrom: null, validUntil: null },
        {
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() }
        }
      ]
    }
  })
  
  return !!crossAccess
}
```

---

## 5. 完整使用示例

### 5.1 用户列表页面（综合权限控制）

```tsx
export function UserListPage() {
  const { hasPermission } = usePermission()
  const { canRead, canWrite } = useFieldPermission('user')
  const { user } = useAuth()
  
  // 根据部门范围获取数据
  const { data: users } = useUsers({
    departmentScope: user.dataScope
  })
  
  // 动态列配置
  const columns = useMemo(() => {
    const cols = [
      { accessorKey: 'name', header: '姓名' },
      { accessorKey: 'email', header: '邮箱' },
    ]
    
    if (canRead('department')) {
      cols.push({ accessorKey: 'department.name', header: '部门' })
    }
    
    if (canRead('salary')) {
      cols.push({ accessorKey: 'salary', header: '薪资' })
    }
    
    // 操作列
    cols.push({
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <PermissionGuard permission="user:update">
            <Button onClick={() => handleEdit(row)}>编辑</Button>
          </PermissionGuard>
          
          <PermissionGuard permission="user:delete">
            <Button onClick={() => handleDelete(row)}>删除</Button>
          </PermissionGuard>
        </div>
      )
    })
    
    return cols
  }, [canRead])
  
  return (
    <div>
      <div className="mb-4">
        <PermissionGuard permission="user:create">
          <Button onClick={handleCreate}>创建用户</Button>
        </PermissionGuard>
        
        <PermissionGuard permission="user:export">
          <Button onClick={handleExport}>导出</Button>
        </PermissionGuard>
      </div>
      
      <DataTable columns={columns} data={users} />
    </div>
  )
}
```

---

## 6. 实施优先级调整

### Phase 1: 部门组织架构（2-3天）
1. 创建 Department 表
2. 实现部门 CRUD API
3. 实现部门树组件
4. 用户关联部门

### Phase 2: 基础权限 + 数据范围（2-3天）
1. 创建 Permission 和 RolePermission 表
2. 实现权限 CRUD API
3. 实现数据范围过滤（DEPT, DEPT_AND_SUB, SELF）
4. 前端权限 Hook

### Phase 3: 字段级权限（2天）
1. 创建 FieldPermission 表
2. 实现字段权限配置界面
3. 前端字段控制
4. 后端字段过滤

### Phase 4: 时间段权限（1-2天）
1. 扩展 RolePermission 表（时间字段）
2. 实现时间验证逻辑
3. 配置界面

### Phase 5: 跨部门访问（1-2天）
1. 创建 CrossDepartmentAccess 表
2. 实现跨部门访问配置
3. 实现跨部门访问检查

### Phase 6: 集成和优化（2-3天）
1. 前端集成所有权限控制
2. 后端集成所有权限检查
3. 性能优化（缓存）
4. 测试和文档

**总计：10-15 天**
