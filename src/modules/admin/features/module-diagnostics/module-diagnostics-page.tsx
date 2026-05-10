'use client'

import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  Copy,
  Download,
  GitBranch,
  KeyRound,
  Network,
  PackageCheck,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { moduleDiagnostics } from '~/modules/module-diagnostics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type ModuleFilter = 'all' | 'dependencies' | 'exports' | 'auth' | 'issues'

const moduleFilters: Array<{ label: string; value: ModuleFilter }> = [
  { label: '全部', value: 'all' },
  { label: '有依赖', value: 'dependencies' },
  { label: '有 exports', value: 'exports' },
  { label: 'Auth 插件', value: 'auth' },
  { label: '有问题', value: 'issues' },
]

function findDuplicates(items: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const item of items) {
    if (seen.has(item)) duplicates.add(item)
    seen.add(item)
  }

  return Array.from(duplicates)
}

export function ModuleDiagnosticsPage(): ReactElement {
  const modules = moduleDiagnostics
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ModuleFilter>('all')
  const dependencyCount = modules.reduce((count, module) => count + (module.dependencies?.length ?? 0), 0)
  const authPluginCount = modules.reduce((count, module) => count + module.betterAuthPluginIds.length, 0)
  const capabilityCount = modules.reduce(
    (count, module) => count + module.exports.reduce((sum, group) => sum + group.keys.length, 0),
    0
  )
  const diagnosticsIssues = useMemo(() => {
    const moduleKeys = new Set(modules.map((module) => module.key))
    const exportKeys = modules.flatMap((module) =>
      module.exports.flatMap((group) => group.keys.map((key) => `${group.name}.${key}`))
    )

    return {
      duplicateExportKeys: findDuplicates(exportKeys),
      duplicatePluginIds: modules.flatMap((module) =>
        findDuplicates(module.betterAuthPluginIds).map((pluginId) => `${module.key}:${pluginId}`)
      ),
      missingDependencies: modules.flatMap((module) =>
        module.dependencies
          .filter((dependency) => !moduleKeys.has(dependency))
          .map((dependency) => `${module.key}:${dependency}`)
      ),
    }
  }, [modules])
  const issueCount =
    diagnosticsIssues.duplicateExportKeys.length +
    diagnosticsIssues.duplicatePluginIds.length +
    diagnosticsIssues.missingDependencies.length
  const normalizedQuery = query.trim().toLowerCase()
  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        const hasIssue =
          module.dependencies.some((dependency) =>
            diagnosticsIssues.missingDependencies.some((item) => item === `${module.key}:${dependency}`)
          ) ||
          findDuplicates(module.betterAuthPluginIds).length > 0 ||
          module.exports.some((group) =>
            group.keys.some((key) => diagnosticsIssues.duplicateExportKeys.includes(`${group.name}.${key}`))
          )
        const matchesFilter =
          filter === 'all' ||
          (filter === 'dependencies' && module.dependencies.length > 0) ||
          (filter === 'exports' && module.exports.length > 0) ||
          (filter === 'auth' && module.betterAuthPluginIds.length > 0) ||
          (filter === 'issues' && hasIssue)

        if (!matchesFilter) return false
        if (!normalizedQuery) return true

        const searchable = [
          module.key,
          module.version ?? '',
          ...module.dependencies,
          ...module.betterAuthPluginIds,
          ...module.exports.flatMap((group) => [group.name, ...group.keys]),
        ]

        return searchable.some((item) => item.toLowerCase().includes(normalizedQuery))
      }),
    [diagnosticsIssues, filter, modules, normalizedQuery]
  )
  const resetFilters = (): void => {
    setQuery('')
    setFilter('all')
  }
  const copyText = async (label: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} 已复制`)
    } catch {
      toast.error(`${label} 复制失败`)
    }
  }
  const exportJson = async (): Promise<void> => {
    const blob = new Blob([JSON.stringify({ modules, issues: diagnosticsIssues }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'module-diagnostics.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('模块诊断 JSON 已导出')
  }

  return (
    <div className='flex h-full flex-col overflow-auto bg-muted/20'>
      <div className='border-b bg-background px-5 py-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>模块诊断</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              显式模块注册、依赖、公开能力与 Better Auth 插件标识的只读检查视图。
            </p>
          </div>
          <Badge variant='outline' className='w-fit'>
            moduleRegistry
          </Badge>
        </div>
      </div>

      <div className='grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2'>
            <CardTitle className='text-sm font-medium'>注册模块</CardTitle>
            <Boxes className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold'>{modules.length}</div>
            <p className='text-xs text-muted-foreground'>显式注册，无自动扫描</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2'>
            <CardTitle className='text-sm font-medium'>依赖声明</CardTitle>
            <GitBranch className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold'>{dependencyCount}</div>
            <p className='text-xs text-muted-foreground'>仅记录真实模块依赖</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2'>
            <CardTitle className='text-sm font-medium'>服务能力</CardTitle>
            <PackageCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold'>{capabilityCount}</div>
            <p className='text-xs text-muted-foreground'>来自模块 exports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2'>
            <CardTitle className='text-sm font-medium'>Auth 插件</CardTitle>
            <ShieldCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold'>{authPluginCount}</div>
            <p className='text-xs text-muted-foreground'>server/client plugin IDs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2'>
            <CardTitle className='text-sm font-medium'>检查项</CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold'>{issueCount}</div>
            <p className='text-xs text-muted-foreground'>重复 ID / 缺失依赖</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mx-4'>
        <CardHeader className='border-b px-4 py-3'>
          <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
            <div className='flex items-center gap-3'>
              <CardTitle className='text-sm font-medium'>模块清单</CardTitle>
              <span className='text-xs text-muted-foreground'>
                {filteredModules.length} / {modules.length} modules
              </span>
            </div>
            <div className='flex flex-col gap-2 md:flex-row md:items-center'>
              <Button type='button' variant='outline' size='sm' onClick={() => void exportJson()}>
                <Download className='h-4 w-4' />
                导出 JSON
              </Button>
              <div className='relative md:w-72'>
                <Search className='pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder='搜索模块、依赖、exports'
                  className='h-9 pr-8 pl-8'
                />
                {query ? (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    className='absolute top-0.5 right-0.5 h-8 w-8'
                    onClick={() => setQuery('')}
                    aria-label='清空搜索'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                ) : null}
              </div>
              <div className='flex flex-wrap gap-1'>
                {moduleFilters.map((item) => (
                  <Button
                    key={item.value}
                    type='button'
                    variant={filter === item.value ? 'secondary' : 'ghost'}
                    size='sm'
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {filteredModules.length > 0 ? (
            filteredModules.map((module) => {
              return (
                <div key={module.key} className='border-b px-4 py-4 last:border-b-0'>
                  <div className='grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(260px,0.7fr)]'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h2 className='font-mono text-sm font-semibold'>{module.key}</h2>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          className='h-6 w-6'
                          aria-label={`复制模块 ${module.key}`}
                          onClick={() => void copyText('模块 key', module.key)}
                        >
                          <Copy className='h-3.5 w-3.5' />
                        </Button>
                        {module.version ? <Badge variant='outline'>v{module.version}</Badge> : null}
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {module.dependencies?.length ? (
                          module.dependencies.map((dependency) => (
                            <Badge key={dependency} variant='secondary'>
                              depends {dependency}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant='outline'>root module</Badge>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        依赖链：
                        {module.dependencies.length > 0
                          ? `${module.dependencies.join(' -> ')} -> ${module.key}`
                          : module.key}
                      </p>
                      {module.dependencies.length > 0 ? (
                        <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                          <Network className='h-3.5 w-3.5' />
                          {module.dependencies.map((dependency) => (
                            <span key={dependency} className='rounded border bg-background px-1.5 py-0.5'>
                              {dependency} {'->'} {module.key}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className='text-xs font-medium text-muted-foreground uppercase'>exports</div>
                      <div className='mt-2 space-y-2'>
                        {module.exports.length > 0 ? (
                          module.exports.map((group) => (
                            <div key={group.name} className='flex flex-wrap items-center gap-2 text-sm'>
                              <span className='min-w-20 font-medium'>{group.name}</span>
                              <div className='flex flex-wrap gap-1.5'>
                                {group.keys.map((key) => (
                                  <span key={key} className='inline-flex items-center gap-1'>
                                    <Badge variant='outline' className='font-mono'>
                                      {key}
                                    </Badge>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon-sm'
                                      className='h-6 w-6'
                                      aria-label={`复制 ${group.name}.${key}`}
                                      onClick={() => void copyText('exports key', `${module.key}.${group.name}.${key}`)}
                                    >
                                      <Copy className='h-3.5 w-3.5' />
                                    </Button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className='text-sm text-muted-foreground'>未声明公开 exports</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className='text-xs font-medium text-muted-foreground uppercase'>better auth</div>
                      <div className='mt-2 flex flex-wrap gap-1.5'>
                        {module.betterAuthPluginIds.length > 0 ? (
                          module.betterAuthPluginIds.map((pluginId, index) => (
                            <span key={`${pluginId}-${index}`} className='inline-flex items-center gap-1'>
                              <Badge variant='outline' className='font-mono'>
                                <KeyRound className='h-3 w-3' />
                                {pluginId}
                              </Badge>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                className='h-6 w-6'
                                aria-label={`复制 Better Auth 插件 ${pluginId}`}
                                onClick={() => void copyText('插件 ID', pluginId)}
                              >
                                <Copy className='h-3.5 w-3.5' />
                              </Button>
                            </span>
                          ))
                        ) : (
                          <p className='text-sm text-muted-foreground'>未声明 Better Auth 插件</p>
                        )}
                      </div>
                      {findDuplicates(module.betterAuthPluginIds).length > 0 ? (
                        <p className='mt-2 text-xs text-amber-600 dark:text-amber-400'>
                          重复插件：{findDuplicates(module.betterAuthPluginIds).join(', ')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='flex flex-col items-center gap-3 px-4 py-10 text-center text-sm text-muted-foreground'>
              <span>没有匹配的模块。</span>
              <Button type='button' variant='outline' size='sm' onClick={resetFilters}>
                重置筛选
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='m-4 mt-3'>
        <CardHeader className='px-4 py-3'>
          <CardTitle className='text-sm font-medium'>检查摘要</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4 pb-4 text-sm text-muted-foreground'>
          <div className='grid gap-2 md:grid-cols-3'>
            <div>
              <div className='text-xs font-medium text-foreground'>重复 exports</div>
              <p>
                {diagnosticsIssues.duplicateExportKeys.length
                  ? diagnosticsIssues.duplicateExportKeys.join(', ')
                  : '未发现'}
              </p>
            </div>
            <div>
              <div className='text-xs font-medium text-foreground'>重复插件 ID</div>
              <p>
                {diagnosticsIssues.duplicatePluginIds.length
                  ? diagnosticsIssues.duplicatePluginIds.join(', ')
                  : '未发现'}
              </p>
            </div>
            <div>
              <div className='text-xs font-medium text-foreground'>缺失依赖</div>
              <p>
                {diagnosticsIssues.missingDependencies.length
                  ? diagnosticsIssues.missingDependencies.join(', ')
                  : '未发现'}
              </p>
            </div>
          </div>
          <Separator />
          <p>模块注册表用于能力发现和诊断，不参与业务运行时依赖注入。</p>
          <Separator />
          <p>新增模块应显式注册，并用 module contract 测试锁定 key、dependencies 和 exports。</p>
        </CardContent>
      </Card>
    </div>
  )
}
