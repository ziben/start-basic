export const logLevels = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
] as const

export const auditResults = [
  { label: '成功', value: 'true' },
  { label: '失败', value: 'false' },
] as const

export const logTypes = [
  { label: '系统日志', value: 'system' },
  { label: '操作日志', value: 'audit' },
] as const
