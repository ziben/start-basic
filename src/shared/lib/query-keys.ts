export const permissionsQueryKeys = {
  all: ['permissions'] as const,
  checkAll: ['permission'] as const,
  list: (userId?: string, organizationId?: string) =>
    [...permissionsQueryKeys.all, userId ?? null, organizationId ?? null] as const,
  check: (userId?: string, permission?: string, organizationId?: string) =>
    ['permission', userId ?? null, permission ?? null, organizationId ?? null] as const,
}

export const userQueryKeys = {
  current: ['user'] as const,
  list: (params?: { page?: number; pageSize?: number; filter?: string }) => ['users', params] as const,
  profile: ['user-profile'] as const,
}

export const authQueryKeys = {
  session: ['auth-session'] as const,
}

export const rbacPermissionsQueryKeys = {
  all: ['rbac', 'permissions'] as const,
  list: (params?: { page?: number; pageSize?: number; filter?: string; resource?: string }) =>
    [...rbacPermissionsQueryKeys.all, 'list', params] as const,
  allList: (options?: { resource?: string; action?: string }) =>
    [...rbacPermissionsQueryKeys.all, 'all', options] as const,
  detail: (id: string) => [...rbacPermissionsQueryKeys.all, id] as const,
}

export const rbacResourcesQueryKeys = {
  all: ['rbac', 'resources'] as const,
}

export const rbacOrgRolesQueryKeys = {
  all: ['rbac', 'org-roles'] as const,
  list: (params: { organizationId: string; page?: number; pageSize?: number; search?: string }) =>
    [...rbacOrgRolesQueryKeys.all, params] as const,
  templates: ['rbac', 'role-templates'] as const,
}

export const translationQueryKeys = {
  all: ['admin', 'translations'] as const,
  list: (locale?: string) => [...translationQueryKeys.all, locale || 'all'] as const,
}

export const navgroupQueryKeys = {
  all: ['admin', 'navgroups'] as const,
  list: (scope?: 'APP' | 'ADMIN') => [...navgroupQueryKeys.all, scope ?? 'ALL'] as const,
  detail: (id: string) => ['admin', 'navgroup', id] as const,
}

export const navitemQueryKeys = {
  all: ['admin', 'navitems'] as const,
  list: (navGroupId?: string, scope?: 'APP' | 'ADMIN') =>
    [...navitemQueryKeys.all, navGroupId ?? null, scope ?? 'ALL'] as const,
  detail: (id: string) => ['admin', 'navitem', id] as const,
}

export const organizationQueryKeys = {
  all: ['admin-organizations'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: string
  }) => [...organizationQueryKeys.all, params] as const,
  detail: (id: string) => ['admin-organization', id] as const,
}

export const roleQueryKeys = {
  all: ['rbac', 'roles'] as const,
  list: (params: { page?: number; pageSize?: number; filter?: string }) =>
    [...roleQueryKeys.all, params] as const,
  allList: () => [...roleQueryKeys.all, 'all'] as const,
  detail: (id: string) => ['rbac', 'role', id] as const,
}

export const rolePermissionsQueryKeys = {
  all: ['role-permissions'] as const,
  list: (roleId: string) => [...rolePermissionsQueryKeys.all, roleId] as const,
}

export const orgRolesQueryKeys = {
  all: ['org-roles'] as const,
  list: (organizationId: string) => [...orgRolesQueryKeys.all, organizationId] as const,
  detail: (organizationId: string, roleIdOrName?: string) =>
    [...orgRolesQueryKeys.all, organizationId, roleIdOrName ?? null] as const,
}

export const departmentQueryKeys = {
  all: ['admin', 'departments'] as const,
  byOrg: (organizationId: string) => [...departmentQueryKeys.all, { organizationId }] as const,
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
  }) => [...memberQueryKeys.all, params] as const,
  detail: (id: string) => ['admin', 'member', id] as const,
}

export const adminUsersQueryKeys = {
  all: ['admin-users'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    banned?: boolean
  }) => [...adminUsersQueryKeys.all, params] as const,
  detail: (id: string) => ['admin-user', id] as const,
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
  }) => [...sessionQueryKeys.all, params] as const,
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
  }) => [...logQueryKeys.all, params] as const,
}

export const sidebarQueryKeys = {
  all: ['sidebar'] as const,
  list: (scope: 'APP' | 'ADMIN') => [...sidebarQueryKeys.all, scope] as const,
}

export const orgPermissionQueryKeys = {
  check: (userId?: string, organizationId?: string, resource?: string, action?: string) =>
    ['org-permission', userId ?? null, organizationId ?? null, resource ?? null, action ?? null] as const,
  role: (userId?: string, organizationId?: string) =>
    ['org-role', userId ?? null, organizationId ?? null] as const,
  has: (permission: [string, string]) => ['has-permission', permission] as const,
}
