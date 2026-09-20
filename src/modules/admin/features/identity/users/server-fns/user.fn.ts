/**
 * User ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/user.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
// ============ 认证辅助函数 ============

import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const ListUsersSchema = z.object({
  page: z.number().int().positive().max(100000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  filter: z.string().optional(),
  banned: z.boolean().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.string().optional(),
  username: z.string().optional(),
  banned: z.boolean().optional(),
})

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  username: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  banned: z.boolean().nullable().optional(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().nullable().optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取用户列表（分页）
 */
export const getUsersFn = createServerFn({ method: 'GET' })
  .validator(ListUsersSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListUsersSchema> }) => {
    await requireAdmin('ListUsers')
    const { UserService } = await import('../services/user.service')
    return UserService.getList(data)
  })

/**
 * 获取单个用户
 */
export const getUserFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('GetUserDetail')
    const { UserService } = await import('../services/user.service')
    return UserService.getById(data.id)
  })

/**
 * 创建用户
 */
export const createUserFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateUserSchema>) => CreateUserSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateUserSchema> }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    await requireAdmin('CreateUser')
    const { UserService } = await import('../services/user.service')
    const request = getRequest()!
    return UserService.create(data, request.headers)
  })

/**
 * 更新用户
 */
export const updateUserFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateUserSchema>) => UpdateUserSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateUserSchema> }) => {
    await requireAdmin('UpdateUser')
    const { UserService } = await import('../services/user.service')
    const { id, ...updateData } = data
    return UserService.update(id, updateData)
  })

/**
 * 删除用户
 */
export const deleteUserFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteUser')
    const { UserService } = await import('../services/user.service')
    return UserService.delete(data.id)
  })

/**
 * 批量删除用户
 */
export const bulkDeleteUsersFn = createServerFn({ method: 'POST' })
  .validator(z.object({ ids: z.array(z.string().min(1)) }))
  .handler(async ({ data }: { data: { ids: string[] } }) => {
    await requireAdmin('BulkDeleteUsers')
    const { UserService } = await import('../services/user.service')
    return UserService.bulkDelete(data.ids)
  })

/**
 * 批量封禁用户
 */
export const bulkBanUsersFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ ids: z.array(z.string().min(1)), banned: z.boolean(), banReason: z.string().min(1).optional() })
  )
  .handler(async ({ data }: { data: { ids: string[]; banned: boolean; banReason?: string } }) => {
    await requireAdmin('BulkBanUsers')
    const { UserService } = await import('../services/user.service')
    return UserService.bulkBan(data.ids, data.banned, data.banReason)
  })
