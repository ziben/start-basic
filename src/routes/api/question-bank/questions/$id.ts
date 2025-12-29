import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const updateQuestionSchema = z.object({
  type: z.string().optional(),
  content: z.string().optional(),
  options: z.any().optional(),
  answer: z.any().optional(),
  explanation: z.string().optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
})

export const Route = createFileRoute('/api/question-bank/questions/$id' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        const { id } = params
        const question = await prisma.question.findUnique({
          where: { id },
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
        })

        if (!question) {
          return new Response('Question not found', { status: 404 })
        }

        return Response.json(question)
      }),

      PUT: withAdminAuth(async (ctx) => {
        const { request } = ctx
        const params = (ctx as any).params as { id: string }
        const { id } = params
        const body = await request.json()
        const parsed = updateQuestionSchema.parse(body)

        // If tagIds is provided, we need to sync tags
        if (parsed.tagIds) {
          await prisma.questionTag.deleteMany({
            where: { questionId: id }
          })
        }

        const question = await prisma.question.update({
          where: { id },
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

      DELETE: withAdminAuth(async (ctx) => {
        const params = (ctx as any).params as { id: string }
        const { id } = params
        await prisma.question.delete({
          where: { id },
        })

        return new Response('Deleted', { status: 200 })
      }),
    },
  },
})





