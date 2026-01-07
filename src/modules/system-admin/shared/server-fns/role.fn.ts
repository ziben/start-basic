/**
 * Role ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListRolesSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
})

const CreateRoleSchema = z.object({
    name: z.string().min(1, '名称不能为空'),
    label: z.string().min(1, '显示名称不能为空'),
    description: z.string().optional(),
})

const UpdateRoleSchema = z.object({
    id: z.string().min(1),
    name: z.string().optional(),
    label: z.string().optional(),
    description: z.string().nullable().optional(),
})

// ============ 认证辅助函数 - 使用动态导入避免客户端打包问题 ============

async function getRequireAdmin() {
    const { requireAdmin } = await import('./auth')
    return requireAdmin
}

// ============ ServerFn 定义 ============

/**
 * 获取角色列表（分页）
 */
export const getRolesFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListRolesSchema>) => data ? ListRolesSchema.parse(data) : {})
    .handler(async ({ data }: { data: z.infer<typeof ListRolesSchema> }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('ListRoles')
        const { RoleService } = await import('../services/role.service')
        return RoleService.getList(data)
    })

/**
 * 获取所有角色（不分页）
 */
export const getAllRolesFn = createServerFn({ method: 'GET' })
    .handler(async () => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('ListAllRoles')
        const { RoleService } = await import('../services/role.service')
        return RoleService.getAll()
    })

/**
 * 获取单个角色
 */
export const getRoleFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('GetRoleDetail')
        const { RoleService } = await import('../services/role.service')
        return RoleService.getById(data.id)
    })

/**
 * 创建角色
 */
export const createRoleFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateRoleSchema>) => CreateRoleSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof CreateRoleSchema> }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('CreateRole')
        const { RoleService } = await import('../services/role.service')
        return RoleService.create(data)
    })

/**
 * 更新角色
 */
export const updateRoleFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateRoleSchema>) => UpdateRoleSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateRoleSchema> }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('UpdateRole')
        const { RoleService } = await import('../services/role.service')
        const { id, ...updateData } = data
        return RoleService.update(id, updateData)
    })

/**
 * 删除角色
 */
export const deleteRoleFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('DeleteRole')
        const { RoleService } = await import('../services/role.service')
        return RoleService.delete(data.id)
    })

/**
 * 为角色分配菜单组
 */
export const assignRoleNavGroupsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; navGroupIds: string[] }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        if (!Array.isArray(data.navGroupIds)) throw new Error('navGroupIds 必须是数组')
        return data
    })
    .handler(async ({ data }: { data: { id: string; navGroupIds: string[] } }) => {
        const requireAdmin = await getRequireAdmin()
        await requireAdmin('AssignRoleNavGroups')
        const { RoleService } = await import('../services/role.service')
        return RoleService.assignNavGroups(data.id, data.navGroupIds)
    })
