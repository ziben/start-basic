import type { ModuleDiagnosticsItem } from './module-diagnostics'

export type ModuleDiagnosticsIssues = {
  duplicateExportKeys: string[]
  duplicatePluginIds: string[]
  missingDependencies: string[]
}

export type ModuleDiagnosticsRecommendation = {
  id: string
  title: string
  detail: string
  action: string
  severity: 'ok' | 'warning'
}

export function findDuplicates(items: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const item of items) {
    if (seen.has(item)) duplicates.add(item)
    seen.add(item)
  }

  return Array.from(duplicates)
}

export function getBetterAuthPluginIds(module: ModuleDiagnosticsItem): string[] {
  return [...module.betterAuthServerPluginIds, ...module.betterAuthClientPluginIds]
}

export function getModuleDiagnosticsIssues(modules: ModuleDiagnosticsItem[]): ModuleDiagnosticsIssues {
  const moduleKeys = new Set(modules.map((module) => module.key))
  const exportKeys = modules.flatMap((module) =>
    module.exports.flatMap((group) => group.keys.map((key) => `${group.name}.${key}`))
  )

  return {
    duplicateExportKeys: findDuplicates(exportKeys),
    duplicatePluginIds: modules.flatMap((module) => [
      ...findDuplicates(module.betterAuthServerPluginIds).map((pluginId) => `${module.key}:server:${pluginId}`),
      ...findDuplicates(module.betterAuthClientPluginIds).map((pluginId) => `${module.key}:client:${pluginId}`),
    ]),
    missingDependencies: modules.flatMap((module) =>
      module.dependencies
        .filter((dependency) => !moduleKeys.has(dependency))
        .map((dependency) => `${module.key}:${dependency}`)
    ),
  }
}

export function getModuleDiagnosticsRecommendations(
  issues: ModuleDiagnosticsIssues
): ModuleDiagnosticsRecommendation[] {
  const recommendations: ModuleDiagnosticsRecommendation[] = []

  if (issues.missingDependencies.length > 0) {
    recommendations.push({
      id: 'missing-dependencies',
      title: '补齐模块依赖注册',
      detail: issues.missingDependencies.join(', '),
      action: '检查 moduleRegistry 是否遗漏模块，或修正模块 dependencies 中的 key。',
      severity: 'warning',
    })
  }

  if (issues.duplicateExportKeys.length > 0) {
    recommendations.push({
      id: 'duplicate-exports',
      title: '收敛重复 exports 命名',
      detail: issues.duplicateExportKeys.join(', '),
      action: '为重复能力补上模块前缀或拆分 export group，避免诊断和文档生成时产生歧义。',
      severity: 'warning',
    })
  }

  if (issues.duplicatePluginIds.length > 0) {
    recommendations.push({
      id: 'duplicate-plugin-ids',
      title: '拆分重复 Better Auth plugin ID',
      detail: issues.duplicatePluginIds.join(', '),
      action: 'server/client 内部不应重复声明同一 plugin ID；跨端同名是允许的。',
      severity: 'warning',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'all-clear',
      title: '当前模块合同稳定',
      detail: '未发现缺失依赖、重复 exports 或端内重复 Better Auth plugin ID。',
      action: '新增模块时继续同步更新 moduleDiagnostics，并补 module contract 测试。',
      severity: 'ok',
    })
  }

  return recommendations
}

export function getModuleIssueCount(issues: ModuleDiagnosticsIssues): number {
  return issues.duplicateExportKeys.length + issues.duplicatePluginIds.length + issues.missingDependencies.length
}
