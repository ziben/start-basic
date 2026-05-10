'use client'

import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Boxes, GitBranch, KeyRound, PackageCheck, Search, ShieldCheck, X } from 'lucide-react'
import { moduleDiagnostics } from '~/modules/module-diagnostics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type ModuleFilter = 'all' | 'dependencies' | 'exports' | 'auth'

const moduleFilters: Array<{ label: string; value: ModuleFilter }> = [
  { label: '全部', value: 'all' },
  { label: '有依赖', value: 'dependencies' },
  { label: '有 exports', value: 'exports' },
  { label: 'Auth 插件', value: 'auth' },
]

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
  const normalizedQuery = query.trim().toLowerCase()
  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        const matchesFilter =
          filter === 'all' ||
          (filter === 'dependencies' && module.dependencies.length > 0) ||
          (filter === 'exports' && module.exports.length > 0) ||
          (filter === 'auth' && module.betterAuthPluginIds.length > 0)

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
    [filter, modules, normalizedQuery]
  )

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

      <div className='grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4'>
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
                                  <Badge key={key} variant='outline' className='font-mono'>
                                    {key}
                                  </Badge>
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
                            <Badge key={`${pluginId}-${index}`} variant='outline' className='font-mono'>
                              <KeyRound className='h-3 w-3' />
                              {pluginId}
                            </Badge>
                          ))
                        ) : (
                          <p className='text-sm text-muted-foreground'>未声明 Better Auth 插件</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='px-4 py-10 text-center text-sm text-muted-foreground'>没有匹配的模块。</div>
          )}
        </CardContent>
      </Card>

      <Card className='m-4 mt-3'>
        <CardHeader className='px-4 py-3'>
          <CardTitle className='text-sm font-medium'>边界说明</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4 pb-4 text-sm text-muted-foreground'>
          <p>模块注册表用于能力发现和诊断，不参与业务运行时依赖注入。</p>
          <Separator />
          <p>新增模块应显式注册，并用 module contract 测试锁定 key、dependencies 和 exports。</p>
        </CardContent>
      </Card>
    </div>
  )
}
