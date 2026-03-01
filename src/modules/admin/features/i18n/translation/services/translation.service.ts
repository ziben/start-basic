/**
 * Translation Service - 纯业务逻辑层 (Prisma 实现)
 * [迁移自 admin/shared/services/translation.service.ts]
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface CreateTranslationInput {
    locale: string
    key: string
    value: string
}

export interface UpdateTranslationInput {
    locale?: string
    key?: string
    value?: string
}

export interface ImportTranslationItem {
    locale: string
    key: string
    value: string
}

// ============ Service 实现 ============

export const TranslationService = {
    /**
     * 获取翻译列表
     */
    async getList(locale?: string) {
        try {
            const where: Record<string, unknown> = {}
            if (locale) where.locale = locale

            return await prisma.translation.findMany({
                where,
                orderBy: { key: 'asc' },
            })
        } catch (error) {
            console.error('获取翻译列表失败:', error)
            throw new Error('获取翻译列表失败')
        }
    },

    /**
     * 获取单个翻译
     */
    async getById(id: string) {
        try {
            const translation = await prisma.translation.findUnique({ where: { id } })
            if (!translation) throw new Error('翻译不存在')
            return translation
        } catch (error) {
            console.error('获取翻译失败:', error)
            throw new Error('获取翻译失败')
        }
    },

    /**
     * 创建翻译
     */
    async create(input: CreateTranslationInput) {
        try {
            return await prisma.translation.create({ data: input })
        } catch (error) {
            console.error('创建翻译失败:', error)
            throw new Error('创建翻译失败')
        }
    },

    /**
     * 更新翻译
     */
    async update(id: string, input: UpdateTranslationInput) {
        try {
            return await prisma.translation.update({
                where: { id },
                data: input,
            })
        } catch (error) {
            console.error('更新翻译失败:', error)
            throw new Error('更新翻译失败')
        }
    },

    /**
     * 删除翻译
     */
    async delete(id: string) {
        try {
            await prisma.translation.delete({ where: { id } })
            return { success: true as const, id }
        } catch (error) {
            console.error('删除翻译失败:', error)
            throw new Error('删除翻译失败')
        }
    },

    /**
     * 导入翻译
     */
    async import(items: ImportTranslationItem[]) {
        try {
            const results = { inserted: 0, updated: 0 }
            for (const item of items) {
                const { locale, key, value } = item
                // 注意：Prisma unique 约束可能是 @@unique([locale, key])
                const existing = await prisma.translation.findFirst({
                    where: { locale, key },
                })

                if (existing) {
                    await prisma.translation.update({
                        where: { id: existing.id },
                        data: { value },
                    })
                    results.updated++
                } else {
                    await prisma.translation.create({
                        data: { locale, key, value },
                    })
                    results.inserted++
                }
            }
            return results
        } catch (error) {
            console.error('导入翻译失败:', error)
            throw new Error('导入翻译失败')
        }
    },

    /**
     * 导出为 CSV
     */
    async exportCsv(locale?: string) {
        try {
            const where: Record<string, unknown> = {}
            if (locale) where.locale = locale

            const items = await prisma.translation.findMany({
                where,
                orderBy: { key: 'asc' },
            })

            const csv = ['locale,key,value']
            for (const it of items) {
                const line = `${it.locale},"${String(it.key).replace(/"/g, '""')}","${String(it.value).replace(/"/g, '""')}"`
                csv.push(line)
            }
            return csv.join('\n')
        } catch (error) {
            console.error('导出翻译失败:', error)
            throw new Error('导出翻译失败')
        }
    },
}

export default TranslationService
