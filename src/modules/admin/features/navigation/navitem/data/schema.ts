import { z } from 'zod'

// 子导航项schema
export const childNavItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().nullable(),
  icon: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  orderIndex: z.number().int(),
  isCollapsible: z.boolean().default(false),
  navGroupId: z.string(),
  parentId: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

// 导航项schema
export const adminNavItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  url: z.string().nullable(),
  icon: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  orderIndex: z.number().int(),
  isCollapsible: z.boolean().default(false),
  navGroupId: z.string(),
  parentId: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  children: z.array(childNavItemSchema).optional(),
  depth: z.number().int().optional(), // 添加深度属性，用于树形结构显示
})

export const adminNavItemListSchema = z.array(adminNavItemSchema)

// 创建导航项的schema
export const createNavItemSchema = z.object({
  title: z.string().min(1),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  isCollapsible: z.boolean().optional(),
  navGroupId: z.string().min(1),
  parentId: z.string().optional(),
  orderIndex: z.number().int().optional(),
})

// 更新导航项的schema
export const updateNavItemSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  isCollapsible: z.boolean().optional(),
  navGroupId: z.string().min(1).optional(),
  parentId: z.string().optional(),
  orderIndex: z.number().int().optional(),
})

export type AdminNavItem = z.infer<typeof adminNavItemSchema>
export type AdminNavItemList = z.infer<typeof adminNavItemListSchema>
export type ChildNavItem = z.infer<typeof childNavItemSchema>
export type CreateNavItemData = z.infer<typeof createNavItemSchema>
export type UpdateNavItemData = z.infer<typeof updateNavItemSchema>

