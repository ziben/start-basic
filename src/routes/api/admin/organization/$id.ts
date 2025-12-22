import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/organization/$id')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ params }) => {
        const { id } = params as { id: string }

        const organization = await prisma.organization.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                members: true,
                invitations: true,
              },
            },
          },
        })

        if (!organization) {
          return new Response('Organization not found', { status: 404 })
        }

        return Response.json({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          createdAt: organization.createdAt.toISOString(),
          metadata: organization.metadata,
          memberCount: organization._count.members,
          invitationCount: organization._count.invitations,
        })
      }),

      PUT: withAdminAuth(async ({ params, request }) => {
        try {
          const { id } = params as { id: string }
          const body = await request.json()
          const schema = z.object({
            name: z.string().min(1).max(100).optional(),
            slug: z.string().optional(),
            logo: z.string().url().optional(),
            metadata: z.string().optional(),
          })
          const input = schema.parse(body)

          const organization = await prisma.organization.findUnique({
            where: { id },
          })
          if (!organization) {
            return new Response('Organization not found', { status: 404 })
          }

          if (input.slug !== undefined && input.slug !== organization.slug) {
            const existing = await prisma.organization.findFirst({
              where: { slug: input.slug },
            })
            if (existing) {
              return new Response('Organization with this slug already exists', { status: 400 })
            }
          }

          const updateData: any = {}
          if (input.name !== undefined) updateData.name = input.name
          if (input.slug !== undefined) updateData.slug = input.slug
          if (input.logo !== undefined) updateData.logo = input.logo
          if (input.metadata !== undefined) updateData.metadata = input.metadata

          const updated = await prisma.organization.update({
            where: { id },
            data: updateData,
            include: {
              _count: {
                select: {
                  members: true,
                  invitations: true,
                },
              },
            },
          })

          return Response.json({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            logo: updated.logo,
            createdAt: updated.createdAt.toISOString(),
            metadata: updated.metadata,
            memberCount: updated._count.members,
            invitationCount: updated._count.invitations,
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),

      DELETE: withAdminAuth(async ({ params }) => {
        const { id } = params as { id: string }

        const organization = await prisma.organization.findUnique({
          where: { id },
        })
        if (!organization) {
          return new Response('Organization not found', { status: 404 })
        }

        await prisma.organization.delete({
          where: { id },
        })

        return Response.json({ success: true })
      }),
    },
  },
})
