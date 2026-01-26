import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../../src/generated/prisma/client'
import { getDatabaseUrl } from '../../../src/shared/lib/database-url'

export async function seedDemo() {
  const DATABASE_URL = getDatabaseUrl()
  const adapter = new PrismaLibSql({ url: DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('Starting demo seed...')

    const existing = await prisma.navGroup.findFirst({
      where: { title: '试验区', scope: 'ADMIN' },
      select: { id: true },
    })

    if (!existing) {
      await prisma.navGroup.create({
        data: {
          title: '试验区',
          scope: 'ADMIN',
          orderIndex: 0,
          roleNavGroups: { create: [{ roleName: 'admin' }] },
          navItems: {
            create: [
              { title: 'App', url: '/demo/apps', icon: 'Package', orderIndex: 0 },
              { title: 'Chats', url: '/demo/chats', icon: 'MessagesSquare', orderIndex: 1 },
              { title: 'Tasks', url: '/demo/tasks', icon: 'ListTodo', orderIndex: 2 },
              { title: 'Profile', url: '/demo/profile', icon: 'UserCog', orderIndex: 3 },
              { title: 'Settings', url: '/demo/settings', icon: 'Settings', orderIndex: 4 },
              { title: 'Users', url: '/demo/users', icon: 'Users', orderIndex: 5 },
              { title: 'Drizzle', url: '/demo/drizzle', icon: 'LayoutDashboard', orderIndex: 6 },
            ],
          },
        },
      })
    }

    console.log('Demo seed complete successfully.')
  } finally {
    await prisma.$disconnect()
  }
}
