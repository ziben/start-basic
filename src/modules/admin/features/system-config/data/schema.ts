import { z } from 'zod'

// ─── Value Type ───────────────────────────────────────────────────────────────

export const CONFIG_VALUE_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'STRING_ARRAY'] as const
export const CONFIG_CHANGE_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'REFRESH'] as const

export const configValueTypeSchema = z.enum(CONFIG_VALUE_TYPES)
export type ConfigValueType = z.infer<typeof configValueTypeSchema>

// ─── System Config ────────────────────────────────────────────────────────────

export const systemConfigSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.string(),
    category: z.string(),
    valueType: configValueTypeSchema,
    isSecret: z.boolean(),
    isPublic: z.boolean(),
    isEnabled: z.boolean(),
    version: z.number().int().nonnegative(),
    description: z.string().nullable(),
    updatedBy: z.string().nullable(),
    publishedAt: z.union([z.string(), z.date()]).nullable(),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
})

export const systemConfigListSchema = z.array(systemConfigSchema)

export type SystemConfig = z.infer<typeof systemConfigSchema>

// ─── System Config Change ─────────────────────────────────────────────────────

export const systemConfigChangeSchema = z.object({
    id: z.string(),
    configId: z.string(),
    configKey: z.string(),
    oldValue: z.string().nullable(),
    newValue: z.string().nullable(),
    valueType: configValueTypeSchema,
    changeType: z.enum(CONFIG_CHANGE_TYPES),
    operatorId: z.string().nullable(),
    operatorName: z.string().nullable(),
    note: z.string().nullable(),
    createdAt: z.union([z.string(), z.date()]),
})

export const systemConfigChangeListSchema = z.array(systemConfigChangeSchema)

export type SystemConfigChange = z.infer<typeof systemConfigChangeSchema>

// ─── UI Constants ─────────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS = [
    { label: 'General', value: 'general' },
    { label: 'Security', value: 'security' },
    { label: 'Performance', value: 'performance' },
    { label: 'Logging', value: 'logging' },
    { label: 'Monitoring', value: 'monitoring' },
] as const

export const VALUE_TYPE_OPTIONS = CONFIG_VALUE_TYPES.map((v) => ({ label: v, value: v }))

export const CHANGE_TYPE_LABELS: Record<string, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    REFRESH: '刷新缓存',
}
