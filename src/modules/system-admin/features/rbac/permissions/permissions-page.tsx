import { AppHeaderMain } from '@/components/layout/app-header-main'
import { PermissionsProvider, usePermissionsContext } from './context/permissions-context'
import { useResourcesQuery, usePermissionsQuery } from './hooks/use-permissions-queries'
import { Button } from '@/components/ui/button'
import { Plus, Shield, Settings2, Key } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionsDialogs } from './components/permissions-dialogs'

function PermissionsContent() {
  const { openResourceDialog, openPermissionDialog, openActionDialog } = usePermissionsContext()
  const { data: resources = [], isLoading: isLoadingResources } = useResourcesQuery()
  const { data: permissions = [], isLoading: isLoadingPermissions } = usePermissionsQuery()

  return (
    <AppHeaderMain>
      <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">权限定义</h2>
          <p className="text-muted-foreground">定义系统资源、操作和基础权限点</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openResourceDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新增资源
          </Button>
          <Button variant="outline" onClick={() => openPermissionDialog()}>
            <Key className="mr-2 h-4 w-4" /> 新增权限
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 资源与操作列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              资源与操作
            </CardTitle>
            <CardDescription>管理系统中的资源及其可执行的操作</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {resources.map((resource: any) => (
                  <div key={resource.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{resource.displayName}</span>
                        <code className="text-xs bg-muted px-1 rounded">{resource.name}</code>
                        <Badge variant={resource.scope === 'GLOBAL' ? 'default' : 'secondary'}>
                          {resource.scope}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openResourceDialog(resource)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {resource.actions?.map((action: any) => (
                        <Badge 
                          key={action.id} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => openActionDialog(resource.id, action)}
                        >
                          {action.displayName} ({action.name})
                        </Badge>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => openActionDialog(resource.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> 操作
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 权限点列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              权限点 (Permission Codes)
            </CardTitle>
            <CardDescription>由资源和操作组合而成的具体权限代码</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {permissions.map((permission: any) => (
                  <div 
                    key={permission.id} 
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => openPermissionDialog(permission)}
                  >
                    <div>
                      <div className="font-medium text-sm">{permission.displayName}</div>
                      <code className="text-xs text-primary font-bold">{permission.code}</code>
                    </div>
                    {permission.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {permission.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
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
