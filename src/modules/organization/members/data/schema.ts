import { z } from 'zod'

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: z.string(),

  // RBAC 字段
  departmentId: z.string().nullable().optional(),

  createdAt: z.string(),

  // 关联数据
  department: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }).nullable().optional(),
})

export type Member = z.infer<typeof memberSchema>
