/**
 * Translation ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const CreateTranslationSchema = z.object({
    locale: z.string().min(1),
    key: z.string().min(1),
    value: z.string().min(1),
})

const UpdateTranslationSchema = z.object({
    id: z.string().min(1),
    locale: z.string().optional(),
    key: z.string().optional(),
    value: z.string().optional(),
})

// ============ 认证辅助函数 ============

async function requireAdmin() {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/identity/shared/lib/auth')

    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw new Error('未登录')

    const adminRoles = ['admin', 'superadmin']
    if (!adminRoles.includes(session.user.role || '')) throw new Error('无权限访问')

    return session.user
}

// ============ ServerFn 定义 ============

export const getTranslationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: { locale?: string }) => data)
    .handler(async ({ data }: { data?: { locale?: string } }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        return TranslationService.getList(data?.locale)
    })

export const getTranslationFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        return TranslationService.getById(data.id)
    })

export const createTranslationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateTranslationSchema>) => CreateTranslationSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof CreateTranslationSchema> }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        return TranslationService.create(data)
    })

export const updateTranslationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateTranslationSchema>) => UpdateTranslationSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateTranslationSchema> }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        const { id, ...updateData } = data
        return TranslationService.update(id, updateData)
    })

export const deleteTranslationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        return TranslationService.delete(data.id)
    })

/**
 * 导入翻译
 */
export const importTranslationsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: Array<{ locale: string; key: string; value: string }>) => {
        if (!Array.isArray(data)) throw new Error('输入必须是数组')
        return data
    })
    .handler(async ({ data }: { data: Array<{ locale: string; key: string; value: string }> }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        return TranslationService.import(data)
    })

/**
 * 导出翻译为 CSV
 * 注意：由于 createServerFn 默认行为，我们可能需要特殊处理 Response
 */
export const exportTranslationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: { locale?: string }) => data)
    .handler(async ({ data }: { data?: { locale?: string } }) => {
        await requireAdmin()
        const { TranslationService } = await import('../services/translation.service')
        const csv = await TranslationService.exportCsv(data?.locale)

        // 直接返回 Response 会被 TanStack Start 识别
        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="translations-${data?.locale || 'all'}.csv"`,
            },
        })
    })
