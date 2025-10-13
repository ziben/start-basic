import { z } from 'zod'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { PrismaClient } from '@prisma/client'
import { withAdminAuth } from '../../../../middleware'

const prisma = new PrismaClient()

// 创建导航项API路由
export const ServerRoute = createServerFileRoute('/api/admin/navitem/').methods({
  // 获取所有导航项
  GET: withAdminAuth(async ({ request }: any) => {
    const url = new URL(request.url)
    const navGroupId = url.searchParams.get('navGroupId')

    // 获取所有导航项
    const items = await getAllNavItems(navGroupId ?? undefined)
    return Response.json(items)
  }),

  // 创建导航项
  POST: withAdminAuth(async ({ request }: any) => {
    try {
      const body = await request.json()
      const createSchema = z.object({
        title: z.string(),
        url: z.string().optional(),
        icon: z.string().optional(),
        badge: z.string().optional(),
        isCollapsible: z.boolean().optional(),
        navGroupId: z.string(),
        parentId: z.string().optional(),
        orderIndex: z.number().optional(),
      })

      const data = createSchema.parse(body)
      const result = await createNavItem(data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  }),
})

/**
 * 获取所有导航项
 */
export async function getAllNavItems(navGroupId?: string) {
  try {
    const whereClause = navGroupId ? { navGroupId } : {}

    const navItems = await prisma.navItem.findMany({
      where: whereClause,
      orderBy: [{ navGroupId: 'asc' }, { orderIndex: 'asc' }],
      include: {
        children: {
          orderBy: [{ navGroupId: 'asc' }, { orderIndex: 'asc' }],
          include: {
            children: {
              orderBy: [{ navGroupId: 'asc' }, { orderIndex: 'asc' }],
            },
          },
        },
      },
    })
    return navItems
  } catch (error) {
    console.error('获取导航项失败:', error)
    throw new Error('获取导航项失败')
  }
}

/**
 * 获取单个导航项
 */
export async function getNavItemById(id: string) {
  try {
    const navItem = await prisma.navItem.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' },
          include: {
            children: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })

    if (!navItem) {
      throw new Error('导航项不存在')
    }

    return navItem
  } catch (error) {
    console.error('获取导航项失败:', error)
    throw new Error('获取导航项失败')
  }
}

/**
 * 创建导航项
 */
export async function createNavItem(data: {
  title: string
  url?: string
  icon?: string
  badge?: string
  isCollapsible?: boolean
  navGroupId: string
  parentId?: string
  orderIndex?: number
}) {
  try {
    // 获取最大orderIndex
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const whereClause = data.parentId ? { parentId: data.parentId } : { navGroupId: data.navGroupId, parentId: null }

      const lastNavItem = await prisma.navItem.findFirst({
        where: whereClause,
        orderBy: { orderIndex: 'desc' },
      })
      orderIndex = lastNavItem ? lastNavItem.orderIndex + 1 : 0
    }

    // 验证父级导航项
    if (data.parentId) {
      const parentItem = await prisma.navItem.findUnique({
        where: { id: data.parentId },
      })

      if (!parentItem) {
        throw new Error('父级导航项不存在')
      }

      // 更新父项为可折叠
      await prisma.navItem.update({
        where: { id: data.parentId },
        data: { isCollapsible: true },
      })
    }

    // 创建导航项
    const navItem = await prisma.navItem.create({
      data: {
        title: data.title,
        url: data.isCollapsible ? null : data.url,
        icon: data.icon,
        badge: data.badge,
        isCollapsible: !!data.isCollapsible,
        orderIndex,
        navGroupId: data.navGroupId,
        parentId: data.parentId,
      },
    })

    return navItem
  } catch (error) {
    console.error('创建导航项失败:', error)
    throw new Error('创建导航项失败')
  }
}

/**
 * 更新导航项
 */
export async function updateNavItem(
  id: string,
  data: {
    title?: string
    url?: string
    icon?: string
    badge?: string
    isCollapsible?: boolean
    navGroupId?: string
    parentId?: string
    orderIndex?: number
  }
) {
  try {
    // 查找当前导航项
    const currentItem = await prisma.navItem.findUnique({
      where: { id },
      include: { children: true },
    })

    if (!currentItem) {
      throw new Error('导航项不存在')
    }

    // 构建更新数据
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.badge !== undefined) updateData.badge = data.badge
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex
    if (data.navGroupId !== undefined) updateData.navGroupId = data.navGroupId

    // 处理可折叠项与URL的关系
    if (data.isCollapsible !== undefined) {
      updateData.isCollapsible = data.isCollapsible
      // 如果变为可折叠项，清除URL
      if (data.isCollapsible && !currentItem.isCollapsible) {
        updateData.url = null
      }
    }

    // 如果设置了URL，确保不是可折叠项
    if (data.url !== undefined && (!updateData.isCollapsible || !currentItem.isCollapsible)) {
      updateData.url = data.url
    }

    // 验证父级导航项
    if (data.parentId !== undefined && data.parentId !== currentItem.parentId) {
      if (data.parentId) {
        const parentItem = await prisma.navItem.findUnique({
          where: { id: data.parentId },
        })

        if (!parentItem) {
          throw new Error('父级导航项不存在')
        }

        // 检查是否会形成循环引用
        if (id === data.parentId) {
          throw new Error('不能将导航项作为自己的父级')
        }

        // 设置父项为可折叠
        await prisma.navItem.update({
          where: { id: data.parentId },
          data: { isCollapsible: true },
        })
      }

      updateData.parentId = data.parentId
    }

    // 更新导航项
    const navItem = await prisma.navItem.update({
      where: { id },
      data: updateData,
    })

    return navItem
  } catch (error) {
    console.error('更新导航项失败:', error)
    throw new Error('更新导航项失败')
  }
}

/**
 * 删除导航项
 */
export async function deleteNavItem(id: string) {
  try {
    // 先检查是否存在
    const navItem = await prisma.navItem.findUnique({
      where: { id },
      include: { children: true },
    })

    if (!navItem) {
      throw new Error('导航项不存在')
    }

    // 删除导航项（会级联删除其子项）
    await prisma.navItem.delete({
      where: { id },
    })

    return { success: true, id }
  } catch (error) {
    console.error('删除导航项失败:', error)
    throw new Error('删除导航项失败')
  }
}

/**
 * 更新导航项顺序
 */
export async function updateNavItemOrder(itemIds: string[]) {
  try {
    // 使用事务更新所有导航项的顺序
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.navItem.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('更新导航项顺序失败:', error)
    throw new Error('更新导航项顺序失败')
  }
}

/**
 * 更新导航项可见性
 * 注意：根据当前的数据模型，我们只能控制导航组的可见性，暂不实现导航项的可见性控制
 */
export async function toggleNavItemVisibility(id: string, isVisible: boolean) {
  try {
    // 检查导航项是否存在
    const navItem = await prisma.navItem.findUnique({
      where: { id },
    })

    if (!navItem) {
      throw new Error('导航项不存在')
    }

    // 更新导航项的可见性
    // 注意：当前模型没有导航项的可见性字段，我们这里使用备注信息更新
    const result = await prisma.navItem.update({
      where: { id },
      data: {
        badge: isVisible ? null : '隐藏',
      },
    })

    return { success: true, isVisible, id }
  } catch (error) {
    console.error('更新导航项可见性失败:', error)
    throw new Error('更新导航项可见性失败')
  }
}
