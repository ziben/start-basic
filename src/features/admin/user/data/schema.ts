import { z } from 'zod'

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  
  role: z.string().nullable().optional(),
  banned: z.boolean().nullable().optional(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().or(z.date()).nullable().optional(),
  username: z.string().nullable().optional(),
  displayUsername: z.string().nullable().optional(),
})

export const adminUserListSchema = z.array(adminUserSchema)

export type AdminUser = z.infer<typeof adminUserSchema>
export type AdminUserList = z.infer<typeof adminUserListSchema>
