import { z } from 'zod'

export const departmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  organizationId: z.string(),
  parentId: z.string().nullable(),
  leader: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  sort: z.number(),
  level: z.number(),
  path: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.string(),
  updatedAt: z.string(),
  // 关联数据
  parent: z.any().nullable().optional(),
  children: z.array(z.any()).optional(),
  memberCount: z.number().optional(),
})

export type Department = z.infer<typeof departmentSchema>
