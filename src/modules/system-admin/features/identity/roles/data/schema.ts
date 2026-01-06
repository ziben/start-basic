import { z } from 'zod'

// 角色现在是配置定义的，不再是数据库表
export const roleSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()),
})

export const roleListSchema = z.array(roleSchema)

export const rolePageSchema = z.object({
  items: roleListSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
})

export type Role = z.infer<typeof roleSchema>
export type RoleList = z.infer<typeof roleListSchema>
export type RolePageData = z.infer<typeof rolePageSchema>

// 保留兼容性
export type SystemRole = Role
export type SystemRoleList = RoleList
export type SystemRolePageData = RolePageData
