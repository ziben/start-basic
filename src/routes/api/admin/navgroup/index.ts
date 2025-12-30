import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

// Prisma 事务客户端类型
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// 创建导航组API路由
export const Route = createFileRoute('/api/admin/navgroup/')({
  server: {
    handlers: {
      // 获取导航组
      GET: withAdminAuth(async ({ request }: any) => {
        const url = new URL(request.url)
        const scope = url.searchParams.get('scope')

        const groups = await getAllNavGroups(
          scope === 'ADMIN' || scope === 'APP' ? (scope as 'ADMIN' | 'APP') : undefined
        )
        return Response.json(groups)
      }),

      // 创建导航组
      POST: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const createSchema = z.object({
            title: z.string(),
            scope: z.enum(['APP', 'ADMIN']).optional(),
            description: z.string().optional(),
            icon: z.string().optional(),
            orderIndex: z.number().optional(),
            isVisible: z.boolean().optional(),
            roles: z.array(z.string()).optional(),
          })

          const data = createSchema.parse(body)
          const result = await createNavGroup(data)
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})

/**
 * 获取所有导航组
 */
export async function getAllNavGroups(scope?: 'APP' | 'ADMIN') {
  try {
    const navGroups = await prisma.navGroup.findMany({
      where: scope ? { scope } : undefined,
      orderBy: { orderIndex: 'asc' },
      include: {
        navItems: {
          orderBy: { orderIndex: 'asc' },
        },
        roleNavGroups: {
          include: {
            systemRole: true,  // 包含角色详情
          },
        },
      },
    })
    return navGroups
  } catch (error) {
    console.error('获取导航组失败:', error)
    throw new Error('获取导航组失败')
  }
}

/**
 * 获取单个导航组
 */
export async function getNavGroupById(id: string) {
  try {
    const navGroup = await prisma.navGroup.findUnique({
      where: { id },
      include: {
        navItems: {
          orderBy: { orderIndex: 'asc' },
        },
        roleNavGroups: {
          include: {
            systemRole: true,  // 包含角色详情
          },
        },
      },
    })
    if (!navGroup) {
      throw new Error('导航组不存在')
    }
    return navGroup
  } catch (error) {
    console.error('获取导航组失败:', error)
    throw new Error('获取导航组失败')
  }
}

/**
 * 创建导航组
 */
export async function createNavGroup(data: {
  title: string
  scope?: 'APP' | 'ADMIN'
  orderIndex?: number
  roles?: string[]
}) {
  try {
    // 获取最大orderIndex
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const lastNavGroup = await prisma.navGroup.findFirst({
        orderBy: { orderIndex: 'desc' },
      })
      orderIndex = lastNavGroup ? lastNavGroup.orderIndex + 1 : 0
    }

    // 创建导航组及其角色关联，返回包含关联的完整对象
    const navGroup = await prisma.$transaction(async (tx: TransactionClient) => {
      // 创建导航组
      const group = await tx.navGroup.create({
        data: {
          title: data.title,
          scope: data.scope ?? 'APP',
          orderIndex,
        },
      })

      // 创建角色关联（使用 roleId）
      if (data.roles && data.roles.length > 0) {
        // 查询角色 ID
        const systemRoles = await tx.systemRole.findMany({
          where: { name: { in: data.roles } },
        })

        if (systemRoles.length > 0) {
          await tx.roleNavGroup.createMany({
            data: systemRoles.map((role) => ({
              roleId: role.id,
              navGroupId: group.id,
            })),
          })
        }
      } else {
        // 默认所有角色可见
        const defaultRoles = await tx.systemRole.findMany({
          where: { name: { in: ['user', 'admin'] } },
        })

        if (defaultRoles.length > 0) {
          await tx.roleNavGroup.createMany({
            data: defaultRoles.map((role) => ({
              roleId: role.id,
              navGroupId: group.id,
            })),
          })
        }
      }

      // 返回带关联的对象，便于前端立即使用
      const full = await tx.navGroup.findUnique({
        where: { id: group.id },
        include: {
          navItems: { orderBy: { orderIndex: 'asc' } },
          roleNavGroups: {
            include: {
              systemRole: true,  // 包含角色详情
            },
          },
        },
      })

      return full
    })

    return navGroup
  } catch (error) {
    console.error('创建导航组失败:', error)
    throw new Error('创建导航组失败')
  }
}

/**
 * 更新导航组
 */
export async function updateNavGroup(
  id: string,
  data: {
    title?: string
    scope?: 'APP' | 'ADMIN'
    orderIndex?: number
    roles?: string[]
  }
) {
  try {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 更新导航组基本信息
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.scope !== undefined) updateData.scope = data.scope
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

      await tx.navGroup.update({
        where: { id },
        data: updateData,
      })

      // 更新角色关联（使用 roleId）
      if (data.roles !== undefined) {
        // 先删除所有现有角色关联
        await tx.roleNavGroup.deleteMany({
          where: { navGroupId: id },
        })

        // 然后创建新的角色关联
        if (data.roles.length > 0) {
          // 查询角色 ID
          const systemRoles = await tx.systemRole.findMany({
            where: { name: { in: data.roles } },
          })

          if (systemRoles.length > 0) {
            await tx.roleNavGroup.createMany({
              data: systemRoles.map((role) => ({
                roleId: role.id,
                navGroupId: id,
              })),
            })
          }
        }
      }

      // 返回包含关联的最新对象
      const full = await tx.navGroup.findUnique({
        where: { id },
        include: {
          navItems: { orderBy: { orderIndex: 'asc' } },
          roleNavGroups: {
            include: {
              systemRole: true,  // 包含角色详情
            },
          },
        },
      })

      return full
    })
  } catch (error) {
    console.error('更新导航组失败:', error)
    throw new Error('更新导航组失败')
  }
}

/**
 * 删除导航组
 */
export async function deleteNavGroup(id: string) {
  try {
    // 先检查是否存在
    const navGroup = await prisma.navGroup.findUnique({
      where: { id },
      include: { navItems: true },
    })

    if (!navGroup) {
      throw new Error('导航组不存在')
    }

    // 使用事务删除导航组及关联数据
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 删除角色关联
      await tx.roleNavGroup.deleteMany({
        where: { navGroupId: id },
      })

      // 删除用户角色关联
      await tx.userRoleNavGroup.deleteMany({
        where: { navGroupId: id },
      })

      // 删除导航组本身（会级联删除其中的导航项）
      await tx.navGroup.delete({
        where: { id },
      })
    })

    return { success: true, id }
  } catch (error) {
    console.error('删除导航组失败:', error)
    throw new Error('删除导航组失败')
  }
}

/**
 * 更新导航组顺序
 */
export async function updateNavGroupOrder(groupIds: string[]) {
  try {
    // 使用事务更新所有导航组的顺序
    await prisma.$transaction(
      groupIds.map((id, index) =>
        prisma.navGroup.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('更新导航组顺序失败:', error)
    throw new Error('更新导航组顺序失败')
  }
}

/**
 * 更新用户个性化导航组设置
 */
export async function updateUserNavGroupVisibility(userId: string, navGroupId: string, visible: boolean) {
  try {
    // 检查关联是否存在
    const existing = await prisma.userRoleNavGroup.findFirst({
      where: {
        userId,
        navGroupId,
      },
    })

    if (existing) {
      // 更新现有记录
      return await prisma.userRoleNavGroup.update({
        where: { id: existing.id },
        data: { visible },
      })
    } else {
      // 创建新记录
      return await prisma.userRoleNavGroup.create({
        data: {
          userId,
          navGroupId,
          visible,
        },
      })
    }
  } catch (error) {
    console.error('更新用户导航组可见性失败:', error)
    throw new Error('更新用户导航组可见性失败')
  }
}





