import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

export const Route = createFileRoute('/api/question-bank/tags/' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async () => {
        const tags = await prisma.tag.findMany({
          orderBy: { name: 'asc' },
        })
        return Response.json(tags)
      }),

      POST: withAdminAuth(async ({ request }) => {
        const body = await request.json()
        const parsed = createTagSchema.parse(body)

        const tag = await prisma.tag.create({
          data: {
            name: parsed.name,
            color: parsed.color,
          },
        })

        return Response.json(tag)
      }),
    },
  },
})




