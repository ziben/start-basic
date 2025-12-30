import { z } from 'zod'

export const systemRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  isSystem: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  navGroups: z.array(z.any()).optional(),
})

export const systemRoleListSchema = z.array(systemRoleSchema)

export const systemRolePageSchema = z.object({
  items: systemRoleListSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
})

export type SystemRole = z.infer<typeof systemRoleSchema>
export type SystemRoleList = z.infer<typeof systemRoleListSchema>
export type SystemRolePageData = z.infer<typeof systemRolePageSchema>

export const createRoleSchema = z.object({
  name: z.string().min(1, '角色编码不能为空'),
  label: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
})

export const updateRoleSchema = createRoleSchema.partial()

export type CreateRoleData = z.infer<typeof createRoleSchema>
export type UpdateRoleData = z.infer<typeof updateRoleSchema>
