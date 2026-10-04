import type { ConfigValueType } from '../data/schema'

/**
 * 将字符串 value 按类型规范化，供前端提交前校验和格式化使用。
 * 后端 service 有独立实现；此处仅用于客户端预校验与 UI 反馈。
 */
export function normalizeValueByType(value: string, valueType: ConfigValueType): string {
    switch (valueType) {
        case 'STRING':
            return value
        case 'NUMBER': {
            const n = Number(value)
            if (!Number.isFinite(n)) throw new Error('NUMBER 类型必须是合法数字')
            return String(n)
        }
        case 'BOOLEAN': {
            const normalized = value.trim().toLowerCase()
            if (normalized === 'true' || normalized === '1') return 'true'
            if (normalized === 'false' || normalized === '0') return 'false'
            throw new Error('BOOLEAN 类型仅支持 true / false / 1 / 0')
        }
        case 'JSON': {
            try {
                return JSON.stringify(JSON.parse(value))
            } catch {
                throw new Error('JSON 类型必须是合法 JSON 字符串')
            }
        }
        case 'STRING_ARRAY': {
            const arr = parseStringArray(value)
            return JSON.stringify(arr)
        }
        default:
            return value
    }
}

/**
 * 将原始字符串解析为字符串数组。
 * 支持 JSON 数组字符串 `["a","b"]` 或逗号/换行分隔的文本。
 */
export function parseStringArray(value: string): string[] {
    const trimmed = value.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed.map(String).map((item) => item.trim()).filter(Boolean)
            }
        } catch {
            // fallback to split
        }
    }

    return trimmed
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

/**
 * 判断布尔类型的字符串值是否为真值
 */
export function isTruthyBooleanInput(value: string): boolean {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
}

/**
 * 对敏感配置遮盖值
 */
export function maskConfigValue(isSecret: boolean, value: string): string {
    return isSecret ? '••••••••' : value
}
