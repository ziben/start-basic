import { AppHeaderMain } from '@/components/layout/app-header-main'
import { PermissionsProvider, usePermissionsContext } from './context/permissions-context'
import { useResourcesQuery, usePermissionsQuery } from './hooks/use-permissions-queries'
import { Button } from '@/components/ui/button'
import { Plus, Shield, Key, Box } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PermissionsDialogs } from './components/permissions-dialogs'
import { PageHeader } from '@/components/layout/page-header'

function PermissionsContent() {
  const { openResourceDialog, openPermissionDialog, openActionDialog } = usePermissionsContext()
  const { data: resources = [] } = useResourcesQuery()
  const { data: permissions = [] } = usePermissionsQuery()

  return (
    <AppHeaderMain>
      <PageHeader 
        title="权限定义" 
        description="管理系统的资源（Resource）、操作（Action）以及最终生成的权限代码（Permission Code）"
      >
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openResourceDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新增资源
          </Button>
          <Button size="sm" variant="outline" onClick={() => openPermissionDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新增权限点
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            资源与操作
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            权限代码
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">资源定义</CardTitle>
              <CardDescription>
                定义系统中的物理或逻辑资源，并为每个资源指定支持的操作（如：create, read, update, delete）。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource: any) => (
                  <Card key={resource.id} className="overflow-hidden border-muted/60">
                    <CardHeader className="bg-muted/30 py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{resource.displayName}</span>
                          <code className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                            {resource.name}
                          </code>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => openResourceDialog(resource)}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {resource.actions?.map((action: any) => (
                          <Badge 
                            key={action.id} 
                            variant="secondary" 
                            className="text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => openActionDialog(resource.id, action)}
                          >
                            {action.displayName}
                          </Badge>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-5 px-1.5 text-[10px] border-dashed"
                          onClick={() => openActionDialog(resource.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" /> 添加操作
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-dashed">
                        <span>作用域: {resource.scope}</span>
                        {resource.isSystem && (
                          <Badge variant="outline" className="text-[9px] h-4 py-0">系统内置</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">权限点列表</CardTitle>
              <CardDescription>
                权限点是“资源 + 操作”的组合。例如 `user:create`。这些代码将用于后端的权限校验。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-3">
                    {permissions.map((permission: any) => (
                      <div 
                        key={permission.id} 
                        className="group relative flex flex-col gap-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openPermissionDialog(permission)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{permission.displayName}</span>
                          {permission.category && (
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1">
                              {permission.category}
                            </Badge>
                          )}
                        </div>
                        <code className="text-xs text-primary font-mono font-bold mt-1">
                          {permission.code}
                        </code>
                        {permission.isSystem && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PermissionsDialogs />
    </AppHeaderMain>
  )
}

export default function PermissionsPage() {
  return (
    <PermissionsProvider>
      <PermissionsContent />
    </PermissionsProvider>
  )
}
