/**
 * Permission ServerFn - 权限服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'

// ============ Schema 定义 ============

const ListPermissionsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    resource: z.string().optional(),
})

const GetAllPermissionsSchema = z.object({
    resource: z.string().optional(),
    action: z.string().optional(),
})

const CreatePermissionSchema = z.object({
    resource: z.string().min(1, '资源不能为空'),
    action: z.string().min(1, '操作不能为空'),
    label: z.string().min(1, '显示名称不能为空'),
    description: z.string().optional(),
})

const UpdatePermissionSchema = z.object({
    id: z.string().min(1),
    label: z.string().optional(),
    description: z.string().nullable().optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取权限列表（分页）
 */
export const getPermissionsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListPermissionsSchema>) =>
        data ? ListPermissionsSchema.parse(data) : {}
    )
    .handler(async ({ data }: { data: z.infer<typeof ListPermissionsSchema> }) => {
        await requireAdmin('ListPermissions')
        const { PermissionService } = await import('../services/permission.service')
        return PermissionService.getList(data)
    })

/**
 * 获取所有权限（不分页）
 */
export const getAllPermissionsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof GetAllPermissionsSchema>) =>
        data ? GetAllPermissionsSchema.parse(data) : {}
    )
    .handler(async ({ data }: { data: z.infer<typeof GetAllPermissionsSchema> }) => {
        await requireAdmin('ListAllPermissions')
        const { PermissionService } = await import('../services/permission.service')
        return PermissionService.getAll(data)
    })

/**
 * 获取单个权限
 */
export const getPermissionFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('GetPermissionDetail')
        const { PermissionService } = await import('../services/permission.service')
        return PermissionService.getById(data.id)
    })

/**
 * 创建权限
 */
export const createPermissionFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreatePermissionSchema>) =>
        CreatePermissionSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof CreatePermissionSchema> }) => {
        await requireAdmin('CreatePermission')
        const { PermissionService } = await import('../services/permission.service')
        return PermissionService.create(data)
    })

/**
 * 更新权限
 */
export const updatePermissionFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdatePermissionSchema>) =>
        UpdatePermissionSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof UpdatePermissionSchema> }) => {
        await requireAdmin('UpdatePermission')
        const { PermissionService } = await import('../services/permission.service')
        const { id, ...updateData } = data
        return PermissionService.update(id, updateData)
    })

/**
 * 删除权限
 */
export const deletePermissionFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('DeletePermission')
        const { PermissionService } = await import('../services/permission.service')
        return PermissionService.delete(data.id)
    })
