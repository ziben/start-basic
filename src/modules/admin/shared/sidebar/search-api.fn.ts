import { createServerFn } from '@tanstack/react-start'

export const globalSearchFn = createServerFn({ method: 'GET' })
    .inputValidator((query: string) => query)
    .handler(async ({ data: query }: { data: string }) => {
        if (!query || query.length < 2) return { users: [], orgs: [] }

        const { default: prisma } = await import('@/shared/lib/db')

        const [users, orgs] = await Promise.all([
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { email: { contains: query } },
                        { username: { contains: query } },
                    ],
                },
                take: 5,
                select: { id: true, name: true, email: true, image: true },
            }),
            prisma.organization.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { slug: { contains: query } },
                    ],
                },
                take: 5,
                select: { id: true, name: true, slug: true, logo: true },
            }),
        ])

        return { users, orgs }
    })
