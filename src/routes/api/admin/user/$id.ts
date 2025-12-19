import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'
import { adminUsersSchema } from '~/features/admin/users/data/schema'

const bodySchema = z
  .object({
    name: z.string().min(1).optional(),
    username: z.string().min(1).nullable().optional(),
    role: z.string().min(1).nullable().optional(),
    banned: z.boolean().nullable().optional(),
    banReason: z.string().nullable().optional(),
    banExpires: z.string().datetime().nullable().optional(),
  })
  .strict()

export const Route = createFileRoute('/api/admin/user/$id' as any)({
  server: {
    handlers: {
      PATCH: withAdminAuth(async ({ request, params }) => {
        try {
          const body = await request.json()
          const data = bodySchema.parse(body)

          const updated = await prisma.user.update({
            where: { id: params.id },
            data: {
              ...(data.name !== undefined ? { name: data.name } : {}),
              ...(data.username !== undefined ? { username: data.username } : {}),
              ...(data.role !== undefined ? { role: data.role } : {}),
              ...(data.banned !== undefined ? { banned: data.banned } : {}),
              ...(data.banReason !== undefined ? { banReason: data.banReason } : {}),
              ...(data.banExpires !== undefined
                ? { banExpires: data.banExpires ? new Date(data.banExpires) : null }
                : {}),
            },
          })

          return Response.json(
            adminUsersSchema.parse({
              id: updated.id,
              name: updated.name,
              email: updated.email,
              emailVerified: updated.emailVerified,
              image: updated.image ?? null,
              createdAt: updated.createdAt,
              updatedAt: updated.updatedAt,
              role: updated.role ?? 'user',
              banned: updated.banned ?? null,
              banReason: updated.banReason ?? null,
              banExpires: updated.banExpires ?? null,
              username: updated.username ?? null,
              displayUsername: updated.displayUsername ?? null,
            })
          )
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
