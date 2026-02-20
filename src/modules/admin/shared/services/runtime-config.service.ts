import { getDb } from '~/shared/lib/db'
import { refreshRuntimeConfig } from '~/shared/config/runtime-config'
import { randomUUID } from 'node:crypto'

export type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'STRING_ARRAY'

export type RuntimeConfigItem = {
  id: string
  key: string
  value: string
  category: string
  valueType: ConfigValueType
  isSecret: boolean
  isPublic: boolean
  isEnabled: boolean
  version: number
  description: string | null
  updatedBy: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type RuntimeConfigChangeItem = {
  id: string
  configId: string
  configKey: string
  oldValue: string | null
  newValue: string | null
  valueType: ConfigValueType
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'REFRESH'
  operatorId: string | null
  operatorName: string | null
  note: string | null
  createdAt: Date
}

export type CreateRuntimeConfigInput = {
  key: string
  value: string
  category: string
  valueType: ConfigValueType
  isSecret?: boolean
  isPublic?: boolean
  isEnabled?: boolean
  description?: string | null
  operatorId?: string | null
  operatorName?: string | null
}

export type UpdateRuntimeConfigInput = {
  id: string
  value: string
  valueType?: ConfigValueType
  isEnabled?: boolean
  isPublic?: boolean
  description?: string | null
  note?: string
  operatorId?: string | null
  operatorName?: string | null
}

export type DeleteRuntimeConfigInput = {
  id: string
  operatorId?: string | null
  operatorName?: string | null
}

function normalizeValueByType(value: string, valueType: ConfigValueType): string {
  switch (valueType) {
    case 'STRING':
      return value
    case 'NUMBER': {
      const n = Number(value)
      if (!Number.isFinite(n)) {
        throw new TypeError('NUMBER 类型必须是合法数字')
      }
      return String(n)
    }
    case 'BOOLEAN': {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return 'true'
      if (normalized === 'false' || normalized === '0') return 'false'
      throw new Error('BOOLEAN 类型仅支持 true/false/1/0')
    }
    case 'JSON': {
      try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed)
      } catch {
        throw new Error('JSON 类型必须是合法 JSON 字符串')
      }
    }
    case 'STRING_ARRAY': {
      const trimmed = value.trim()
      if (!trimmed) return '[]'

      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (!Array.isArray(parsed)) {
            throw new TypeError('STRING_ARRAY 必须是字符串数组')
          }
          return JSON.stringify(parsed.map(String))
        } catch {
          throw new Error('STRING_ARRAY 必须是合法 JSON 数组')
        }
      }

      const arr = trimmed
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
      return JSON.stringify(arr)
    }
    default:
      return value
  }
}

export const RuntimeConfigService = {
  async create(input: CreateRuntimeConfigInput): Promise<RuntimeConfigItem> {
    const prisma = await getDb()
    const id = randomUUID()
    const now = new Date()

    const normalizedValue = normalizeValueByType(input.value, input.valueType)

    await prisma.$executeRaw`
      INSERT INTO "system_config" (
        "id",
        "key",
        "value",
        "category",
        "valueType",
        "isSecret",
        "isPublic",
        "isEnabled",
        "version",
        "description",
        "updatedBy",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${id},
        ${input.key},
        ${normalizedValue},
        ${input.category},
        ${input.valueType}::"ConfigValueType",
        ${input.isSecret ?? false},
        ${input.isPublic ?? false},
        ${input.isEnabled ?? true},
        1,
        ${input.description ?? null},
        ${input.operatorId ?? null},
        ${now},
        ${now}
      )
    `

    await prisma.$executeRaw`
      INSERT INTO "system_config_change" (
        "id",
        "configId",
        "configKey",
        "oldValue",
        "newValue",
        "valueType",
        "changeType",
        "operatorId",
        "operatorName",
        "note",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${id},
        ${input.key},
        NULL,
        ${normalizedValue},
        ${input.valueType}::"ConfigValueType",
        'CREATE'::"ConfigChangeType",
        ${input.operatorId ?? null},
        ${input.operatorName ?? null},
        NULL,
        NOW()
      )
    `

    const rows = await prisma.$queryRaw<RuntimeConfigItem[]>`
      SELECT
        "id", "key", "value", "category", "valueType",
        "isSecret", "isPublic", "isEnabled", "version",
        "description", "updatedBy", "publishedAt", "createdAt", "updatedAt"
      FROM "system_config"
      WHERE "id" = ${id}
      LIMIT 1
    `

    const created = rows[0]
    if (!created) throw new Error('配置创建后读取失败')
    return created
  },

  async delete(input: DeleteRuntimeConfigInput): Promise<void> {
    const prisma = await getDb()

    const rows = await prisma.$queryRaw<RuntimeConfigItem[]>`
      SELECT "id", "key", "value", "valueType"
      FROM "system_config"
      WHERE "id" = ${input.id}
      LIMIT 1
    `
    const current = rows[0]
    if (!current) throw new Error('配置不存在')

    await prisma.$executeRaw`
      INSERT INTO "system_config_change" (
        "id",
        "configId",
        "configKey",
        "oldValue",
        "newValue",
        "valueType",
        "changeType",
        "operatorId",
        "operatorName",
        "note",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${current.id},
        ${current.key},
        ${current.value},
        NULL,
        ${current.valueType}::"ConfigValueType",
        'DELETE'::"ConfigChangeType",
        ${input.operatorId ?? null},
        ${input.operatorName ?? null},
        NULL,
        NOW()
      )
    `

    await prisma.$executeRaw`
      DELETE FROM "system_config"
      WHERE "id" = ${input.id}
    `
  },

  async list(): Promise<RuntimeConfigItem[]> {
    const prisma = await getDb()
    const rows = await prisma.$queryRaw<RuntimeConfigItem[]>`
      SELECT
        "id",
        "key",
        "value",
        "category",
        "valueType",
        "isSecret",
        "isPublic",
        "isEnabled",
        "version",
        "description",
        "updatedBy",
        "publishedAt",
        "createdAt",
        "updatedAt"
      FROM "system_config"
      ORDER BY "category" ASC, "key" ASC
    `
    return rows
  },

  async update(input: UpdateRuntimeConfigInput): Promise<RuntimeConfigItem> {
    const prisma = await getDb()

    const currentRows = await prisma.$queryRaw<RuntimeConfigItem[]>`
      SELECT
        "id",
        "key",
        "value",
        "category",
        "valueType",
        "isSecret",
        "isPublic",
        "isEnabled",
        "version",
        "description",
        "updatedBy",
        "publishedAt",
        "createdAt",
        "updatedAt"
      FROM "system_config"
      WHERE "id" = ${input.id}
      LIMIT 1
    `

    const current = currentRows[0]
    if (!current) {
      throw new Error('配置不存在')
    }

    const nextValueType = input.valueType ?? current.valueType
    const nextIsEnabled = input.isEnabled ?? current.isEnabled
    const nextIsPublic = input.isPublic ?? current.isPublic
    const nextDescription = input.description === undefined ? current.description : input.description
    const nextValue = normalizeValueByType(input.value, nextValueType)

    await prisma.$executeRaw`
      UPDATE "system_config"
      SET
        "value" = ${nextValue},
        "valueType" = ${nextValueType}::"ConfigValueType",
        "isEnabled" = ${nextIsEnabled},
        "isPublic" = ${nextIsPublic},
        "description" = ${nextDescription},
        "version" = "version" + 1,
        "updatedBy" = ${input.operatorId ?? current.updatedBy},
        "publishedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "id" = ${input.id}
    `

    await prisma.$executeRaw`
      INSERT INTO "system_config_change" (
        "id",
        "configId",
        "configKey",
        "oldValue",
        "newValue",
        "valueType",
        "changeType",
        "operatorId",
        "operatorName",
        "note",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${current.id},
        ${current.key},
        ${current.value},
        ${nextValue},
        ${nextValueType}::"ConfigValueType",
        'UPDATE'::"ConfigChangeType",
        ${input.operatorId ?? null},
        ${input.operatorName ?? null},
        ${input.note ?? null},
        NOW()
      )
    `

    const updatedRows = await prisma.$queryRaw<RuntimeConfigItem[]>`
      SELECT
        "id",
        "key",
        "value",
        "category",
        "valueType",
        "isSecret",
        "isPublic",
        "isEnabled",
        "version",
        "description",
        "updatedBy",
        "publishedAt",
        "createdAt",
        "updatedAt"
      FROM "system_config"
      WHERE "id" = ${input.id}
      LIMIT 1
    `

    const updated = updatedRows[0]
    if (!updated) {
      throw new Error('配置更新后读取失败')
    }

    return updated
  },

  async listChanges(configId: string, take = 50): Promise<RuntimeConfigChangeItem[]> {
    const prisma = await getDb()
    const rows = await prisma.$queryRaw<RuntimeConfigChangeItem[]>`
      SELECT
        "id",
        "configId",
        "configKey",
        "oldValue",
        "newValue",
        "valueType",
        "changeType",
        "operatorId",
        "operatorName",
        "note",
        "createdAt"
      FROM "system_config_change"
      WHERE "configId" = ${configId}
      ORDER BY "createdAt" DESC
      LIMIT ${take}
    `
    return rows
  },

  async refresh(operatorId?: string | null, operatorName?: string | null): Promise<{ refreshedAt: number }> {
    const result = await refreshRuntimeConfig()

    const prisma = await getDb()
    const configs = await this.list()
    const enabledConfigs = configs.filter((config) => config.isEnabled)
    const anchor = enabledConfigs[0]

    if (anchor) {
      await prisma.$executeRaw`
        INSERT INTO "system_config_change" (
          "id",
          "configId",
          "configKey",
          "oldValue",
          "newValue",
          "valueType",
          "changeType",
          "operatorId",
          "operatorName",
          "note",
          "createdAt"
        )
        VALUES (
          ${randomUUID()},
          ${anchor.id},
          '__system__.refresh',
          NULL,
          NULL,
          'JSON'::"ConfigValueType",
          'REFRESH'::"ConfigChangeType",
          ${operatorId ?? null},
          ${operatorName ?? null},
          ${`manual refresh (${enabledConfigs.length} enabled configs)`},
          NOW()
        )
      `
    }

    return result
  },
}
