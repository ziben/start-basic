import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  orderIndex: z.number().optional(),
})

export const Route = createFileRoute('/api/question-bank/categories/$id' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        const category = await prisma.category.findUnique({
          where: { id: params.id },
          include: {
            children: true,
          },
        })

        if (!category) {
          return new Response('Category not found', { status: 404 })
        }

        return Response.json(category)
      }),

      PUT: withAdminAuth(async (ctx) => {
        const { request } = ctx
        const params = (ctx as any).params as { id: string }
        const body = await request.json()
        const parsed = updateCategorySchema.parse(body)

        // Check for circular reference if parentId is changed
        if (parsed.parentId) {
          if (parsed.parentId === params.id) {
            return new Response('Cannot set parent to self', { status: 400 })
          }
          // Simple depth check could be added here, 
          // but for now we'll just update and recalculate depth
        }

        let depth = undefined
        if (parsed.parentId !== undefined) {
          if (parsed.parentId === null) {
            depth = 0
          } else {
            const parent = await prisma.category.findUnique({
              where: { id: parsed.parentId },
            })
            if (parent) {
              depth = parent.depth + 1
            }
          }
        }

        const category = await prisma.category.update({
          where: { id: params.id },
          data: {
            name: parsed.name,
            description: parsed.description,
            parentId: parsed.parentId,
            orderIndex: parsed.orderIndex,
            ...(depth !== undefined ? { depth } : {}),
          },
        })

        return Response.json(category)
      }),

      DELETE: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        
        // Check if has children
        const childrenCount = await prisma.category.count({
          where: { parentId: params.id },
        })

        if (childrenCount > 0) {
          return new Response('Cannot delete category with children', { status: 400 })
        }

        await prisma.category.delete({
          where: { id: params.id },
        })

        return new Response(null, { status: 204 })
      }),
    },
  },
})





