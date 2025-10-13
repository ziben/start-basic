import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { withAdminAuth } from '../../../../middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// 创建导航组API路由
export const ServerRoute = createServerFileRoute('/api/admin/navgroup/').methods({
  // 获取导航组
  GET: withAdminAuth(async ({ request }: any) => {
    // 获取所有导航组
    const groups = await getAllNavGroups()
    return Response.json(groups)
  }),
  
  // 创建导航组
  POST: withAdminAuth(async ({ request }: any) => {
    try {
      const body = await request.json()
      const createSchema = z.object({
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        orderIndex: z.number().optional(),
        isVisible: z.boolean().optional()
      })
      
      const data = createSchema.parse(body)
      const result = await createNavGroup(data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})

/**
 * 获取所有导航组
 */
export async function getAllNavGroups() {
  try {
    const navGroups = await prisma.navGroup.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        navItems: {
          orderBy: { orderIndex: 'asc' },
        },
        roleNavGroups: true,
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
        roleNavGroups: true,
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

    // 创建导航组及其角色关联
    const navGroup = await prisma.$transaction(async (tx) => {
      // 创建导航组
      const group = await tx.navGroup.create({
        data: {
          title: data.title,
          orderIndex,
        },
      })

      // 创建角色关联
      if (data.roles && data.roles.length > 0) {
        await tx.roleNavGroup.createMany({
          data: data.roles.map(role => ({
            role,
            navGroupId: group.id,
          })),
        })
      } else {
        // 默认所有角色可见
        await tx.roleNavGroup.createMany({
          data: [
            { role: 'user', navGroupId: group.id },
            { role: 'admin', navGroupId: group.id },
          ],
        })
      }

      return group
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
    orderIndex?: number
    roles?: string[]
  }
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 更新导航组基本信息
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

      const navGroup = await tx.navGroup.update({
        where: { id },
        data: updateData,
      })

      // 更新角色关联
      if (data.roles !== undefined) {
        // 先删除所有现有角色关联
        await tx.roleNavGroup.deleteMany({
          where: { navGroupId: id },
        })

        // 然后创建新的角色关联
        if (data.roles.length > 0) {
          await tx.roleNavGroup.createMany({
            data: data.roles.map(role => ({
              role,
              navGroupId: id,
            })),
          })
        }
      }

      return navGroup
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
    await prisma.$transaction(async (tx) => {
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
export async function updateUserNavGroupVisibility(
  userId: string,
  navGroupId: string,
  visible: boolean
) {
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
