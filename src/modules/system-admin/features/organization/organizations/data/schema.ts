import { z } from 'zod'

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo: z.string().nullable(),
  createdAt: z.string(),
  metadata: z.string().nullable(),
  _count: z
    .object({
      members: z.number(),
      departments: z.number(),
    })
    .optional(),
})

export type Organization = z.infer<typeof organizationSchema>
