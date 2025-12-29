import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const createQuestionSchema = z.object({
  type: z.string(),
  content: z.string(),
  options: z.any().optional(),
  answer: z.any(),
  explanation: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional().default(1),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
})

export const Route = createFileRoute('/api/question-bank/questions/' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const categoryId = url.searchParams.get('categoryId')
        const type = url.searchParams.get('type')
        const q = url.searchParams.get('q')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const where: any = {}
        if (categoryId) where.categoryId = categoryId
        if (type) where.type = type
        if (q) {
          where.content = { contains: q }
        }

        const [items, total] = await Promise.all([
          prisma.question.findMany({
            where,
            include: {
              category: true,
              tags: {
                include: {
                  tag: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.question.count({ where }),
        ])

        return Response.json({ items, total })
      }),

      POST: withAdminAuth(async ({ request }) => {
        const body = await request.json()
        const parsed = createQuestionSchema.parse(body)

        const question = await prisma.question.create({
          data: {
            type: parsed.type,
            content: parsed.content,
            options: parsed.options,
            answer: parsed.answer,
            explanation: parsed.explanation,
            difficulty: parsed.difficulty,
            categoryId: parsed.categoryId,
            tags: parsed.tagIds ? {
              create: parsed.tagIds.map(tagId => ({
                tagId
              }))
            } : undefined
          },
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        })

        return Response.json(question)
      }),
    },
  },
})





