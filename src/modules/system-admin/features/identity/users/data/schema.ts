import { z } from 'zod'

export const adminUsersSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),

  role: z.string().nullable().optional(),
  roleIds: z.array(z.string()).optional(),
  systemRoles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().or(z.date()).nullable().optional(),
  username: z.string().nullable().optional(),
  displayUsername: z.string().nullable().optional(),
})

export const adminUsersListSchema = z.array(adminUsersSchema)

export const adminUsersPageSchema = z.object({
  items: adminUsersListSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
})

export type AdminUser = z.infer<typeof adminUsersSchema>
export type AdminUserList = z.infer<typeof adminUsersListSchema>
export type AdminUserPageData = z.infer<typeof adminUsersPageSchema>

// UI 常量
export const banned = [
  { label: '已封禁', value: true },
  { label: '正常', value: false },
]

