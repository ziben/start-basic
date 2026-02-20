export type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'STRING_ARRAY'

export type AdminRuntimeConfig = {
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
  publishedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type AdminRuntimeConfigChange = {
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
  createdAt: string | Date
}
