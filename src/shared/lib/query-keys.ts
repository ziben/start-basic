export const permissionsQueryKeys = {
  all: ['permissions'] as const,
  checkAll: ['permission'] as const,
  list: (userId?: string, organizationId?: string) =>
    [...permissionsQueryKeys.all, 'list', userId ?? null, organizationId ?? null] as const,
  check: (userId?: string, permission?: string, organizationId?: string) =>
    ['permission', userId ?? null, permission ?? null, organizationId ?? null] as const,
}

export const userQueryKeys = {
  all: ['users'] as const,
  current: ['users', 'current'] as const,
  list: (params?: { page?: number; pageSize?: number; filter?: string }) =>
    [...userQueryKeys.all, 'list', params] as const,
  profile: ['users', 'profile'] as const,
}

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
}

export const rbacPermissionsQueryKeys = {
  all: ['rbac', 'permissions'] as const,
  list: (params?: { page?: number; pageSize?: number; filter?: string; resource?: string }) =>
    [...rbacPermissionsQueryKeys.all, 'list', params] as const,
  allList: (options?: { resource?: string; action?: string }) =>
    [...rbacPermissionsQueryKeys.all, 'all', options] as const,
  detail: (id: string) => [...rbacPermissionsQueryKeys.all, 'detail', id] as const,
}

export const rbacResourcesQueryKeys = {
  all: ['rbac', 'resources'] as const,
}

export const rbacOrgRolesQueryKeys = {
  all: ['rbac', 'org-roles'] as const,
  list: (params: { organizationId: string; page?: number; pageSize?: number; search?: string }) =>
    [...rbacOrgRolesQueryKeys.all, 'list', params] as const,
  templates: ['rbac', 'role-templates'] as const,
}

export const translationQueryKeys = {
  all: ['admin', 'translations'] as const,
  list: (locale?: string) => [...translationQueryKeys.all, 'list', locale || 'all'] as const,
}

export const navgroupQueryKeys = {
  all: ['admin', 'navgroups'] as const,
  list: (scope?: 'APP' | 'ADMIN') => [...navgroupQueryKeys.all, 'list', scope ?? 'ALL'] as const,
  detail: (id: string) => [...navgroupQueryKeys.all, 'detail', id] as const,
}

export const navitemQueryKeys = {
  all: ['admin', 'navitems'] as const,
  list: (navGroupId?: string, scope?: 'APP' | 'ADMIN') =>
    [...navitemQueryKeys.all, 'list', navGroupId ?? null, scope ?? 'ALL'] as const,
  detail: (id: string) => [...navitemQueryKeys.all, 'detail', id] as const,
}

export const organizationQueryKeys = {
  all: ['admin', 'organizations'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: string
  }) => [...organizationQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...organizationQueryKeys.all, 'detail', id] as const,
}

export const roleQueryKeys = {
  all: ['rbac', 'roles'] as const,
  list: (params: { page?: number; pageSize?: number; filter?: string }) =>
    [...roleQueryKeys.all, 'list', params] as const,
  allList: () => [...roleQueryKeys.all, 'all'] as const,
  detail: (id: string) => [...roleQueryKeys.all, 'detail', id] as const,
}

export const rolePermissionsQueryKeys = {
  all: ['rbac', 'role-permissions'] as const,
  list: (roleId: string) => [...rolePermissionsQueryKeys.all, 'list', roleId] as const,
}

export const orgRolesQueryKeys = {
  all: ['rbac', 'org-roles'] as const,
  list: (organizationId: string) => [...orgRolesQueryKeys.all, 'list', organizationId] as const,
  detail: (organizationId: string, roleIdOrName?: string) =>
    [...orgRolesQueryKeys.all, 'detail', organizationId, roleIdOrName ?? null] as const,
}

export const departmentQueryKeys = {
  all: ['admin', 'departments'] as const,
  byOrg: (organizationId: string) => [...departmentQueryKeys.all, 'by-org', { organizationId }] as const,
  tree: (organizationId: string) => [...departmentQueryKeys.all, 'tree', organizationId] as const,
  detail: (id: string) => [...departmentQueryKeys.all, 'detail', id] as const,
  subDepts: (id: string) => [...departmentQueryKeys.all, 'sub', id] as const,
}

export const memberQueryKeys = {
  all: ['admin', 'members'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    sortBy?: string
    sortDir?: string
  }) => [...memberQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...memberQueryKeys.all, 'detail', id] as const,
}

export const adminUsersQueryKeys = {
  all: ['admin', 'users'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    banned?: boolean
  }) => [...adminUsersQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminUsersQueryKeys.all, 'detail', id] as const,
}

export const sessionQueryKeys = {
  all: ['admin', 'sessions'] as const,
  list: (params: {
    page: number
    pageSize: number
    filter?: string
    status?: Array<'active' | 'expired'>
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }) => [...sessionQueryKeys.all, 'list', params] as const,
}

export const logQueryKeys = {
  all: ['admin', 'logs'] as const,
  list: (params: {
    type: 'system' | 'audit'
    page: number
    pageSize: number
    filter?: string
    level?: 'debug' | 'info' | 'warn' | 'error'
    success?: boolean
    action?: string
    actorUserId?: string
    targetType?: string
    targetId?: string
    from?: string
    to?: string
  }) => [...logQueryKeys.all, 'list', params] as const,
}

export const sidebarQueryKeys = {
  all: ['sidebar'] as const,
  list: (scope: 'APP' | 'ADMIN') => [...sidebarQueryKeys.all, 'list', scope] as const,
}

export const systemConfigQueryKeys = {
  all: ['admin', 'system-config'] as const,
  list: () => [...systemConfigQueryKeys.all, 'list'] as const,
  history: (configId: string) => [...systemConfigQueryKeys.all, 'history', configId] as const,
}

export const runtimeConfigQueryKeys = systemConfigQueryKeys

export const orgPermissionQueryKeys = {
  all: ['rbac', 'org-permissions'] as const,
  check: (userId?: string, organizationId?: string, resource?: string, action?: string) =>
    [...orgPermissionQueryKeys.all, 'check', userId ?? null, organizationId ?? null, resource ?? null, action ?? null] as const,
  role: (userId?: string, organizationId?: string) =>
    [...orgPermissionQueryKeys.all, 'role', userId ?? null, organizationId ?? null] as const,
  has: (permission: [string, string]) => [...orgPermissionQueryKeys.all, 'has', permission] as const,
}
