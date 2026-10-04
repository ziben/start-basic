/**
 * Department Server Functions
 * [迁移自 admin/shared/server-fns/department.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
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
  .validator(z.object({ organizationId: z.string().min(1, '组织ID不能为空') }))
  .handler(async ({ data }) => {
    await requireAdmin('ListDepartments')
    return await DepartmentService.getByOrganization(data.organizationId)
  })

/**
 * 获取部门树
 */
export const getDepartmentTreeFn = createServerFn({ method: 'GET' })
  .validator(z.object({ organizationId: z.string().min(1, '组织ID不能为空') }))
  .handler(async ({ data }) => {
    await requireAdmin('GetDepartmentTree')
    return await DepartmentService.getTree(data.organizationId)
  })

/**
 * 获取单个部门
 */
export const getDepartmentFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1, '部门ID不能为空') }))
  .handler(async ({ data }) => {
    await requireAdmin('GetDepartment')
    return await DepartmentService.getById(data.id)
  })

/**
 * 创建部门
 */
export const createDepartmentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateDepartmentSchema>) => CreateDepartmentSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('CreateDepartment')
    return await DepartmentService.create(data)
  })

/**
 * 更新部门
 */
export const updateDepartmentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateDepartmentSchema>) => UpdateDepartmentSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('UpdateDepartment')
    const { id, ...updateData } = data
    return await DepartmentService.update(id, updateData)
  })

/**
 * 删除部门
 */
export const deleteDepartmentFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1, '部门ID不能为空') }))
  .handler(async ({ data }) => {
    await requireAdmin('DeleteDepartment')
    return await DepartmentService.delete(data.id)
  })

/**
 * 获取下级部门
 */
export const getSubDepartmentsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ departmentId: z.string().min(1, '部门ID不能为空') }))
  .handler(async ({ data }) => {
    await requireAdmin('ListSubDepartments')
    return await DepartmentService.getSubDepartments(data.departmentId)
  })
