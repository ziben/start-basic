import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = (createFileRoute('/api/admin/organization/member/$id' as any) as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ params }: any) => {
        const { id } = params as { id: string }

        const member = await prisma.member.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })

        if (!member) {
          return new Response('Member not found', { status: 404 })
        }

        return Response.json({
          id: member.id,
          userId: member.userId,
          username: member.user?.name ?? '',
          email: member.user?.email ?? '',
          organizationId: member.organizationId,
          organizationName: member.organization?.name ?? '',
          organizationSlug: member.organization?.slug ?? '',
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        })
      }),

      PUT: withAdminAuth(async ({ params, request }: any) => {
        try {
          const { id } = params as { id: string }

          let body
          try {
            body = await request.json()
          } catch {
            return new Response('Invalid JSON in request body', { status: 400 })
          }

          const schema = z.object({
            role: z.string().min(1).optional(),
          })

          let input
          try {
            input = schema.parse(body)
          } catch (e) {
            return new Response(`Validation error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
              status: 400,
            })
          }

          const member = await prisma.member.findUnique({
            where: { id },
          })
          if (!member) {
            return new Response('Member not found', { status: 404 })
          }

          const updateData: any = {}
          if (input.role !== undefined) updateData.role = input.role

          const updated = await prisma.member.update({
            where: { id },
            data: updateData,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          })

          return Response.json({
            id: updated.id,
            userId: updated.userId,
            username: updated.user?.name ?? '',
            email: updated.user?.email ?? '',
            organizationId: updated.organizationId,
            organizationName: updated.organization?.name ?? '',
            organizationSlug: updated.organization?.slug ?? '',
            role: updated.role,
            createdAt: updated.createdAt.toISOString(),
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),

      DELETE: withAdminAuth(async ({ params }: any) => {
        const { id } = params as { id: string }

        const member = await prisma.member.findUnique({
          where: { id },
        })
        if (!member) {
          return new Response('Member not found', { status: 404 })
        }

        await prisma.member.delete({
          where: { id },
        })

        return Response.json({ success: true })
      }),
    },
  },
})
