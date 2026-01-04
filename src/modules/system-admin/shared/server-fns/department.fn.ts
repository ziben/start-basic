/**
 * Department Server Functions
 */

import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import DepartmentService from '../services/department.service'

// ============ Schema 定义 ============

const CreateDepartmentSchema = z.object({
    name: z.string().min(1, '部门名称不能为空'),
    code: z.string().min(1, '部门编码不能为空'),
    organizationId: z.string().min(1, '组织ID不能为空'),
    parentId: z.string().optional(),
    leader: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('邮箱格式不正确').optional(),
    sort: z.number().optional(),
})

const UpdateDepartmentSchema = z.object({
    id: z.string().min(1, '部门ID不能为空'),
    name: z.string().optional(),
    code: z.string().optional(),
    parentId: z.string().nullable().optional(),
    leader: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('邮箱格式不正确').optional(),
    sort: z.number().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取组织的部门列表
 */
export const getDepartmentsFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { organizationId: string }) => {
        if (!data.organizationId) {
            throw new Error('组织ID不能为空')
        }
        return data
    })
    .handler(async ({ data }) => {
        return await DepartmentService.getByOrganization(data.organizationId)
    })

/**
 * 获取部门树
 */
export const getDepartmentTreeFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { organizationId: string }) => {
        if (!data.organizationId) {
            throw new Error('组织ID不能为空')
        }
        return data
    })
    .handler(async ({ data }) => {
        return await DepartmentService.getTree(data.organizationId)
    })

/**
 * 获取单个部门
 */
export const getDepartmentFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data.id) {
            throw new Error('部门ID不能为空')
        }
        return data
    })
    .handler(async ({ data }) => {
        return await DepartmentService.getById(data.id)
    })

/**
 * 创建部门
 */
export const createDepartmentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateDepartmentSchema>) => CreateDepartmentSchema.parse(data))
    .handler(async ({ data }) => {
        return await DepartmentService.create(data)
    })

/**
 * 更新部门
 */
export const updateDepartmentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateDepartmentSchema>) => UpdateDepartmentSchema.parse(data))
    .handler(async ({ data }) => {
        const { id, ...updateData } = data
        return await DepartmentService.update(id, updateData)
    })

/**
 * 删除部门
 */
export const deleteDepartmentFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data.id) {
            throw new Error('部门ID不能为空')
        }
        return data
    })
    .handler(async ({ data }) => {
        return await DepartmentService.delete(data.id)
    })

/**
 * 获取下级部门
 */
export const getSubDepartmentsFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { departmentId: string }) => {
        if (!data.departmentId) {
            throw new Error('部门ID不能为空')
        }
        return data
    })
    .handler(async ({ data }) => {
        return await DepartmentService.getSubDepartments(data.departmentId)
    })
