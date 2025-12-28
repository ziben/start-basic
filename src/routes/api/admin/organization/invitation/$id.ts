import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = (createFileRoute('/api/admin/organization/invitation/$id' as any) as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ params }: any) => {
        const { id } = params as { id: string }

        const invitation = await prisma.invitation.findUnique({
          where: { id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })

        if (!invitation) {
          return new Response('Invitation not found', { status: 404 })
        }

        return Response.json({
          id: invitation.id,
          email: invitation.email,
          organizationId: invitation.organizationId,
          organizationName: invitation.organization?.name ?? '',
          organizationSlug: invitation.organization?.slug ?? '',
          role: invitation.role,
          status: invitation.status,
          createdAt: null,
          expiresAt: invitation.expiresAt?.toISOString() ?? null,
        })
      }),

      PUT: withAdminAuth(async ({ params, request }: any) => {
        try {
          const { id } = params as { id: string }
          const body = await request.json()
          const schema = z.object({
            email: z.string().email().optional(),
            role: z.string().min(1).optional(),
            status: z.enum(['pending', 'accepted', 'expired', 'cancelled']).optional(),
            expiresAt: z.string().optional(),
          })
          const input = schema.parse(body)

          const invitation = await prisma.invitation.findUnique({
            where: { id },
          })
          if (!invitation) {
            return new Response('Invitation not found', { status: 404 })
          }

          const updateData: any = {}
          if (input.email !== undefined) updateData.email = input.email
          if (input.role !== undefined) updateData.role = input.role
          if (input.status !== undefined) updateData.status = input.status
          if (input.expiresAt !== undefined) {
            updateData.expiresAt = input.expiresAt
              ? new Date(input.expiresAt)
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }

          const updated = await prisma.invitation.update({
            where: { id },
            data: updateData,
            include: {
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
            email: updated.email,
            organizationId: updated.organizationId,
            organizationName: updated.organization?.name ?? '',
            organizationSlug: updated.organization?.slug ?? '',
            role: updated.role,
            status: updated.status,
            createdAt: null,
            expiresAt: updated.expiresAt?.toISOString() ?? null,
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),

      DELETE: withAdminAuth(async ({ params }: any) => {
        const { id } = params as { id: string }

        const invitation = await prisma.invitation.findUnique({
          where: { id },
        })
        if (!invitation) {
          return new Response('Invitation not found', { status: 404 })
        }

        await prisma.invitation.delete({
          where: { id },
        })

        return Response.json({ success: true })
      }),
    },
  },
})
