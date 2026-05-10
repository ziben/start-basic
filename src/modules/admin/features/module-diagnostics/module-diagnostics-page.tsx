import type { ReactElement } from 'react'
import { Boxes, GitBranch, KeyRound, PackageCheck, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { moduleRegistry } from '~/modules'
import type { AppModule } from '~/core/module-registry'

type ExportGroup = {
  name: string
  keys: string[]
}

function getExportGroups(exportsRecord: Record<string, unknown> | undefined): ExportGroup[] {
  if (!exportsRecord) return []

  return Object.entries(exportsRecord).map(([name, value]) => ({
    name,
    keys:
      value && typeof value === 'object'
        ? Object.keys(value as Record<string, unknown>)
        : ['default'],
  }))
}

function getModuleCapabilityCount(module: AppModule): number {
  return getExportGroups(module.exports).reduce((sum, group) => sum + group.keys.length, 0)
}

function getModulePluginIds(module: AppModule): string[] {
  return [
    ...(module.betterAuth?.serverPluginIds ?? []),
    ...(module.betterAuth?.clientPluginIds ?? []),
  ]
}

export function ModuleDiagnosticsPage(): ReactElement {
  const modules: readonly AppModule[] = moduleRegistry.modules
  const dependencyCount = modules.reduce(
    (count, module) => count + (module.dependencies?.length ?? 0),
    0
  )
  const serverPluginIds = moduleRegistry.getBetterAuthServerPluginIds()
  const clientPluginIds = moduleRegistry.getBetterAuthClientPluginIds()
  const capabilityCount = modules.reduce(
    (count, module) => count + getModuleCapabilityCount(module),
    0
  )

  return (
    <div className="flex h-full flex-col overflow-auto bg-muted/20">
      <div className="border-b bg-background px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">模块诊断</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              显式模块注册、依赖、公开能力与 Better Auth 插件标识的只读检查视图。
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            moduleRegistry
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">注册模块</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">显式注册，无自动扫描</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">依赖声明</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{dependencyCount}</div>
            <p className="text-xs text-muted-foreground">仅记录真实模块依赖</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">服务能力</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{capabilityCount}</div>
            <p className="text-xs text-muted-foreground">来自模块 exports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Auth 插件</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{serverPluginIds.length + clientPluginIds.length}</div>
            <p className="text-xs text-muted-foreground">server/client plugin IDs</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-4">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">模块清单</CardTitle>
            <span className="text-xs text-muted-foreground">{modules.length} modules</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {modules.map((module) => {
            const exportGroups = getExportGroups(module.exports)
            const pluginIds = getModulePluginIds(module)

            return (
              <div key={module.key} className="border-b px-4 py-4 last:border-b-0">
                <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(260px,0.7fr)]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-sm font-semibold">{module.key}</h2>
                      {module.version ? <Badge variant="outline">v{module.version}</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {module.dependencies?.length ? (
                        module.dependencies.map((dependency) => (
                          <Badge key={dependency} variant="secondary">
                            depends {dependency}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">root module</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground">exports</div>
                    <div className="mt-2 space-y-2">
                      {exportGroups.length > 0 ? (
                        exportGroups.map((group) => (
                          <div key={group.name} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="min-w-20 font-medium">{group.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {group.keys.map((key) => (
                                <Badge key={key} variant="outline" className="font-mono">
                                  {key}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">未声明公开 exports</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground">better auth</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pluginIds.length > 0 ? (
                        pluginIds.map((pluginId) => (
                          <Badge key={pluginId} variant="outline" className="font-mono">
                            <KeyRound className="h-3 w-3" />
                            {pluginId}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">未声明 Better Auth 插件</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="m-4 mt-3">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">边界说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
          <p>模块注册表用于能力发现和诊断，不参与业务运行时依赖注入。</p>
          <Separator />
          <p>新增模块应显式注册，并用 module contract 测试锁定 key、dependencies 和 exports。</p>
        </CardContent>
      </Card>
    </div>
  )
}
