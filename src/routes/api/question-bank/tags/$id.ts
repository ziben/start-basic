import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional().nullable(),
})

export const Route = createFileRoute('/api/question-bank/tags/$id' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        const tag = await prisma.tag.findUnique({
          where: { id: params.id },
        })

        if (!tag) {
          return new Response('Tag not found', { status: 404 })
        }

        return Response.json(tag)
      }),

      PUT: withAdminAuth(async (ctx) => {
        const { request } = ctx
        const params = (ctx as any).params as { id: string }
        const body = await request.json()
        const parsed = updateTagSchema.parse(body)

        const tag = await prisma.tag.update({
          where: { id: params.id },
          data: {
            name: parsed.name,
            color: parsed.color,
          },
        })

        return Response.json(tag)
      }),

      DELETE: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        await prisma.tag.delete({
          where: { id: params.id },
        })

        return new Response(null, { status: 204 })
      }),
    },
  },
})


