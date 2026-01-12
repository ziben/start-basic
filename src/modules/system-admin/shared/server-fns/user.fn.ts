/**
 * User ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListUsersSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
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

// ============ 认证辅助函数 ============

import { requireAdmin } from './auth'

// ============ ServerFn 定义 ============

/**
 * 获取用户列表（分页）
 */
export const getUsersFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListUsersSchema>) => (data ? ListUsersSchema.parse(data) : {}))
    .handler(async ({ data }: { data: z.infer<typeof ListUsersSchema> }) => {
        await requireAdmin('ListUsers')
        const { UserService } = await import('../services/user.service')
        return UserService.getList(data)
    })

/**
 * 获取单个用户
 */
export const getUserFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('GetUserDetail')
        const { UserService } = await import('../services/user.service')
        return UserService.getById(data.id)
    })

/**
 * 创建用户
 */
export const createUserFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateUserSchema>) => CreateUserSchema.parse(data))
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
    .inputValidator((data: z.infer<typeof UpdateUserSchema>) => UpdateUserSchema.parse(data))
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
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('DeleteUser')
        const { UserService } = await import('../services/user.service')
        return UserService.delete(data.id)
    })

/**
 * 批量删除用户
 */
export const bulkDeleteUsersFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }: { data: { ids: string[] } }) => {
        await requireAdmin('BulkDeleteUsers')
        const { UserService } = await import('../services/user.service')
        return UserService.bulkDelete(data.ids)
    })

/**
 * 批量封禁用户
 */
export const bulkBanUsersFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[]; banned: boolean; banReason?: string }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        if (typeof data.banned !== 'boolean') throw new Error('banned 必须是布尔值')
        return data
    })
    .handler(async ({ data }: { data: { ids: string[]; banned: boolean; banReason?: string } }) => {
        await requireAdmin('BulkBanUsers')
        const { UserService } = await import('../services/user.service')
        return UserService.bulkBan(data.ids, data.banned, data.banReason)
    })
