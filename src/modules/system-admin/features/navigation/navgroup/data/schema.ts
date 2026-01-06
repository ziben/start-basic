import { z } from 'zod'

// 简化的导航项schema，用于显示在导航组表格中
export const navItemSimpleSchema = z.object({
  id: z.string(),
  title: z.string(),
  orderIndex: z.number(),
  isCollapsible: z.boolean().optional(),
  url: z.string().nullable().optional(),
})

// 角色关联schema
export const roleNavGroupSchema = z.object({
  id: z.string(),
  role: z.string(),
  navGroupId: z.string(),
  createdAt: z.string().or(z.date()),
})

// 用户与导航组关联（简化）
export const userRoleNavGroupSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  navGroupId: z.string(),
  visible: z.boolean().optional(),
  createdAt: z.string().or(z.date()),
})

// 导航组schema
export const adminNavgroupSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: '标题不能为空' }),
  scope: z.enum(['APP', 'ADMIN']).default('APP'),
  orderIndex: z.number().int(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  navItems: z.array(navItemSimpleSchema).optional(),
  roleNavGroups: z.array(roleNavGroupSchema).optional(),
  userRoleNavGroups: z.array(userRoleNavGroupSchema).optional(),
})

export const adminNavgroupListSchema = z.array(adminNavgroupSchema)

export const createNavgroupSchema = z.object({
  title: z.string().min(1, { message: '标题不能为空' }),
  scope: z.enum(['APP', 'ADMIN']).default('APP'),
  orderIndex: z.number().int().optional(),
  // roles represents initial RoleNavGroup entries to create alongside NavGroup
  roles: z.array(z.string()).optional(),
})

export const updateNavgroupSchema = z.object({
  title: z.string().min(1, { message: '标题不能为空' }).optional(),
  scope: z.enum(['APP', 'ADMIN']).optional(),
  orderIndex: z.number().int().optional(),
  roles: z.array(z.string()).optional(),
})

export type AdminNavgroup = z.infer<typeof adminNavgroupSchema>
export type AdminNavgroupList = z.infer<typeof adminNavgroupListSchema>
export type CreateNavgroupData = z.infer<typeof createNavgroupSchema>
export type UpdateNavgroupData = z.infer<typeof updateNavgroupSchema>
export type NavItemSimple = z.infer<typeof navItemSimpleSchema>
export type RoleNavGroup = z.infer<typeof roleNavGroupSchema>
export type UserRoleNavGroup = z.infer<typeof userRoleNavGroupSchema>

