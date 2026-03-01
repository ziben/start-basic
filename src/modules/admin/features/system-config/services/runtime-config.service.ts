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
    const normalizedValue = normalizeValueByType(input.value, input.valueType)

    return await prisma.$transaction(async (tx) => {
      const created = await tx.systemConfig.create({
        data: {
          id,
          key: input.key,
          value: normalizedValue,
          category: input.category,
          valueType: input.valueType,
          isSecret: input.isSecret ?? false,
          isPublic: input.isPublic ?? false,
          isEnabled: input.isEnabled ?? true,
          version: 1,
          description: input.description ?? null,
          updatedBy: input.operatorId ?? null,
        }
      })

      await tx.systemConfigChange.create({
        data: {
          configId: id,
          configKey: input.key,
          newValue: normalizedValue,
          valueType: input.valueType,
          changeType: 'CREATE',
          operatorId: input.operatorId ?? null,
          operatorName: input.operatorName ?? null,
        }
      })

      return created
    })
  },

  async delete(input: DeleteRuntimeConfigInput): Promise<void> {
    const prisma = await getDb()

    await prisma.$transaction(async (tx) => {
      const current = await tx.systemConfig.findUnique({
        where: { id: input.id },
        select: { id: true, key: true, value: true, valueType: true }
      })
      if (!current) throw new Error('配置不存在')

      await tx.systemConfigChange.create({
        data: {
          configId: current.id,
          configKey: current.key,
          oldValue: current.value,
          valueType: current.valueType,
          changeType: 'DELETE',
          operatorId: input.operatorId ?? null,
          operatorName: input.operatorName ?? null,
        }
      })

      await tx.systemConfig.delete({
        where: { id: input.id }
      })
    })
  },

  async list(): Promise<RuntimeConfigItem[]> {
    const prisma = await getDb()
    return prisma.systemConfig.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })
  },

  async listPublic(): Promise<RuntimeConfigItem[]> {
    const prisma = await getDb()
    return prisma.systemConfig.findMany({
      where: {
        isPublic: true,
        isEnabled: true
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })
  },

  async update(input: UpdateRuntimeConfigInput): Promise<RuntimeConfigItem> {
    const prisma = await getDb()

    return await prisma.$transaction(async (tx) => {
      const current = await tx.systemConfig.findUnique({
        where: { id: input.id }
      })
      if (!current) throw new Error('配置不存在')

      const nextValueType = input.valueType ?? current.valueType
      const nextIsEnabled = input.isEnabled ?? current.isEnabled
      const nextIsPublic = input.isPublic ?? current.isPublic
      const nextDescription = input.description === undefined ? current.description : input.description
      const nextValue = normalizeValueByType(input.value, nextValueType)

      const updated = await tx.systemConfig.update({
        where: { id: input.id },
        data: {
          value: nextValue,
          valueType: nextValueType,
          isEnabled: nextIsEnabled,
          isPublic: nextIsPublic,
          description: nextDescription,
          version: { increment: 1 },
          updatedBy: input.operatorId ?? current.updatedBy,
          publishedAt: new Date(),
        }
      })

      await tx.systemConfigChange.create({
        data: {
          configId: current.id,
          configKey: current.key,
          oldValue: current.value,
          newValue: nextValue,
          valueType: nextValueType,
          changeType: 'UPDATE',
          operatorId: input.operatorId ?? null,
          operatorName: input.operatorName ?? null,
          note: input.note ?? null,
        }
      })

      return updated
    })
  },

  async listChanges(configId: string, take = 50): Promise<RuntimeConfigChangeItem[]> {
    const prisma = await getDb()
    return prisma.systemConfigChange.findMany({
      where: { configId },
      orderBy: { createdAt: 'desc' },
      take,
    })
  },

  async refresh(operatorId?: string | null, operatorName?: string | null): Promise<{ refreshedAt: number }> {
    const result = await refreshRuntimeConfig()

    const prisma = await getDb()
    const configs = await this.list()
    const enabledConfigs = configs.filter((config) => config.isEnabled)
    const anchor = enabledConfigs[0]

    if (anchor) {
      await prisma.systemConfigChange.create({
        data: {
          configId: anchor.id,
          configKey: '__system__.refresh',
          valueType: 'JSON',
          changeType: 'REFRESH',
          operatorId: operatorId ?? null,
          operatorName: operatorName ?? null,
          note: `manual refresh (${enabledConfigs.length} enabled configs)`,
        }
      })
    }

    return result
  },
}
