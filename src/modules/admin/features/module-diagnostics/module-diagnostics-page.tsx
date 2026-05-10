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

export function ModuleDiagnosticsPage(): ReactElement {
  const modules: readonly AppModule[] = moduleRegistry.modules
  const dependencyCount = modules.reduce(
    (count, module) => count + (module.dependencies?.length ?? 0),
    0
  )
  const serverPluginIds = moduleRegistry.getBetterAuthServerPluginIds()
  const clientPluginIds = moduleRegistry.getBetterAuthClientPluginIds()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">模块诊断</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          查看当前显式注册的业务模块、依赖关系、公开能力与 Better Auth 插件标识。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">注册模块</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">显式注册，无自动扫描</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">依赖声明</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dependencyCount}</div>
            <p className="text-xs text-muted-foreground">仅记录真实模块依赖</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">服务能力</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.reduce(
                (count, module) =>
                  count + getExportGroups(module.exports).reduce((sum, group) => sum + group.keys.length, 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">来自模块 exports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth 插件</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverPluginIds.length + clientPluginIds.length}</div>
            <p className="text-xs text-muted-foreground">server/client plugin IDs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">模块清单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((module) => {
            const exportGroups = getExportGroups(module.exports)

            return (
              <div key={module.key} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{module.key}</h2>
                  {module.version ? <Badge variant="outline">v{module.version}</Badge> : null}
                  {module.dependencies?.map((dependency) => (
                    <Badge key={dependency} variant="secondary">
                      depends on {dependency}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium">公开能力</div>
                    <div className="mt-2 space-y-2">
                      {exportGroups.length > 0 ? (
                        exportGroups.map((group) => (
                          <div key={group.name} className="text-sm">
                            <span className="font-medium">{group.name}</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {group.keys.map((key) => (
                                <Badge key={key} variant="outline">
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
                    <div className="text-sm font-medium">Better Auth</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        ...(module.betterAuth?.serverPluginIds ?? []),
                        ...(module.betterAuth?.clientPluginIds ?? []),
                      ].length > 0 ? (
                        [
                          ...(module.betterAuth?.serverPluginIds ?? []),
                          ...(module.betterAuth?.clientPluginIds ?? []),
                        ].map((pluginId) => (
                          <Badge key={pluginId} variant="outline">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">边界说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>模块注册表用于能力发现和诊断，不参与业务运行时依赖注入。</p>
          <Separator />
          <p>新增模块应显式注册，并用 module contract 测试锁定 key、dependencies 和 exports。</p>
        </CardContent>
      </Card>
    </div>
  )
}
