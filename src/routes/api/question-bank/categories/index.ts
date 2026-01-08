import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { withAdminAuth } from '~/middleware'

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  orderIndex: z.number().optional().default(0),
})

export const Route = createFileRoute('/api/question-bank/categories/' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const prisma = (await import('@/shared/lib/db')).default
        const url = new URL(request.url)
        const isTree = url.searchParams.get('tree') === '1'

        const categories = await prisma.category.findMany({
          orderBy: { orderIndex: 'asc' },
        })

        if (!isTree) {
          return Response.json(categories)
        }

        // Build tree
        const map = new Map()
        const roots: any[] = []

        categories.forEach((cat) => {
          map.set(cat.id, { ...cat, children: [] })
        })

        categories.forEach((cat) => {
          const node = map.get(cat.id)
          if (cat.parentId && map.has(cat.parentId)) {
            map.get(cat.parentId).children.push(node)
          } else {
            roots.push(node)
          }
        })

        return Response.json(roots)
      }),

      POST: withAdminAuth(async ({ request }) => {
        const prisma = (await import('@/shared/lib/db')).default
        const body = await request.json()
        const parsed = createCategorySchema.parse(body)

        let depth = 0
        if (parsed.parentId) {
          const parent = await prisma.category.findUnique({
            where: { id: parsed.parentId },
          })
          if (parent) {
            depth = parent.depth + 1
          }
        }

        const category = await prisma.category.create({
          data: {
            name: parsed.name,
            description: parsed.description,
            parentId: parsed.parentId,
            orderIndex: parsed.orderIndex,
            depth,
          },
        })

        return Response.json(category)
      }),
    },
  },
})





