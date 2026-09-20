/**
 * NavItem ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/navitem.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
// ============ 认证辅助函数 ============

import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const CreateNavItemSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  isCollapsible: z.boolean().optional(),
  navGroupId: z.string().min(1, '菜单组ID不能为空'),
  parentId: z.string().optional(),
  orderIndex: z.number().optional(),
})

const UpdateNavItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  isCollapsible: z.boolean().optional(),
  navGroupId: z.string().optional(),
  parentId: z.string().optional(),
  orderIndex: z.number().optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取导航项列表
 */
export const getNavItemsFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({ navGroupId: z.string().min(1).optional(), scope: z.enum(['APP', 'ADMIN']).optional() }).optional()
  )
  .handler(async ({ data }: { data?: { navGroupId?: string; scope?: 'APP' | 'ADMIN' } }) => {
    await requireAdmin('ListNavItems')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.getAll(data?.navGroupId, data?.scope)
  })

/**
 * 获取单个导航项
 */
export const getNavItemFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('GetNavItemDetail')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.getById(data.id)
  })

/**
 * 创建导航项
 */
export const createNavItemFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateNavItemSchema>) => CreateNavItemSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateNavItemSchema> }) => {
    await requireAdmin('CreateNavItem')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.create(data)
  })

/**
 * 更新导航项
 */
export const updateNavItemFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateNavItemSchema>) => UpdateNavItemSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateNavItemSchema> }) => {
    await requireAdmin('UpdateNavItem')
    const { NavItemService } = await import('../services/navitem.service')
    const { id, ...updateData } = data
    return NavItemService.update(id, updateData)
  })

/**
 * 删除导航项
 */
export const deleteNavItemFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteNavItem')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.delete(data.id)
  })

/**
 * 更新排序
 */
export const updateNavItemOrderFn = createServerFn({ method: 'POST' })
  .validator(z.object({ itemIds: z.array(z.string().min(1)) }))
  .handler(async ({ data }: { data: { itemIds: string[] } }) => {
    await requireAdmin('UpdateNavItemOrder')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.updateOrder(data.itemIds)
  })

/**
 * 切换导航项可见性
 */
export const toggleNavItemVisibilityFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1), isVisible: z.boolean() }))
  .handler(async ({ data }: { data: { id: string; isVisible: boolean } }) => {
    await requireAdmin('ToggleNavItemVisibility')
    const { NavItemService } = await import('../services/navitem.service')
    return NavItemService.toggleVisibility(data.id, data.isVisible)
  })
