import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('banned'),
  z.literal('active'),
])
export type AdminUserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('admin'),
  z.literal('user'),
])

export const adminUsersSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  
  role: z.string(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().or(z.date()).nullable().optional(),
  username: z.string().nullable().optional(),
  displayUsername: z.string().nullable().optional(),
})

export const adminUsersListSchema = z.array(adminUsersSchema)

export type AdminUsers = z.infer<typeof adminUsersSchema>
export type AdminUsersList = z.infer<typeof adminUsersListSchema>
