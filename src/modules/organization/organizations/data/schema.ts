import { z } from 'zod'

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo: z.string().nullable(),
  createdAt: z.string(),
  metadata: z.string().nullable(),
  memberCount: z.number().optional(),
  departmentCount: z.number().optional(),
  invitationCount: z.number().optional(),
})

export type Organization = z.infer<typeof organizationSchema>
