import { QueryState } from '@/shared/components/query-state'
import { Plus, Shield, Key, Box, Pencil } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeaderMain } from '@/components/layout/app-header-main'
import { PageHeader } from '@/components/layout/page-header'
import { PermissionsDialogs } from './components/permissions-dialogs'
import { PermissionsProvider, usePermissionsContext } from './context/permissions-context'
import { useResourcesQuery, usePermissionsQuery } from './hooks/use-permissions-queries'

function PermissionsContent() {
  const { t } = useTranslation()
  const { openResourceDialog, openPermissionDialog, openActionDialog } = usePermissionsContext()
  const resourcesQuery = useResourcesQuery()
  const permissionsQuery = usePermissionsQuery()
  const resources = resourcesQuery.data ?? []
  const permissions = permissionsQuery.data ?? []

  return (
    <AppHeaderMain>
      <PageHeader hide={false} title={t('admin.permission.title')} description={t('admin.permission.desc')}>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' onClick={() => openResourceDialog()}>
            <Plus className='mr-2 h-4 w-4' /> {t('admin.permission.button.createResource')}
          </Button>
          <Button size='sm' variant='outline' onClick={() => openPermissionDialog()}>
            <Plus className='mr-2 h-4 w-4' /> {t('admin.permission.button.createPermission')}
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue='resources' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='resources' className='flex items-center gap-2'>
            <Box className='h-4 w-4' />
            {t('admin.permission.tabs.resources')}
          </TabsTrigger>
          <TabsTrigger value='permissions' className='flex items-center gap-2'>
            <Key className='h-4 w-4' />
            {t('admin.permission.tabs.permissions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='resources'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-medium'>{t('admin.permission.resources.title')}</CardTitle>
              <CardDescription>{t('admin.permission.resources.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <QueryState
                isLoading={resourcesQuery.isLoading}
                error={resourcesQuery.error}
                onRetry={() => void resourcesQuery.refetch()}
                isRetrying={resourcesQuery.isRefetching}
              >
                {resources.length === 0 && (
                  <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin.common.noData')}</p>
                )}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {resources.map((resource: any) => (
                    <Card key={resource.id} className='overflow-hidden border-muted/60'>
                      <CardHeader className='bg-muted/30 px-4 py-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-bold'>{resource.displayName}</span>
                            <code className='rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground'>
                              {resource.name}
                            </code>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            aria-label={`${t('admin.common.edit')} ${resource.displayName}`}
                            onClick={() => openResourceDialog(resource)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4 p-4'>
                        <div className='flex flex-wrap gap-1.5'>
                          {resource.actions?.map((action: any) => (
                            <button
                              type='button'
                              key={action.id}
                              className='rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring'
                              aria-label={`${t('admin.common.edit')} ${action.displayName}`}
                              onClick={() => openActionDialog(resource.id, action)}
                            >
                              {action.displayName}
                            </button>
                          ))}
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-5 border-dashed px-1.5 text-[10px]'
                            onClick={() => openActionDialog(resource.id)}
                          >
                            <Plus className='mr-1 h-3 w-3' /> {t('admin.permission.resources.addAction')}
                          </Button>
                        </div>
                        <div className='flex items-center justify-between border-t border-dashed pt-2 text-[10px] text-muted-foreground'>
                          <span>{t('admin.permission.resources.scope', { scope: resource.scope })}</span>
                          {resource.isSystem && (
                            <Badge variant='outline' className='h-4 py-0 text-[9px]'>
                              {t('admin.permission.resources.system')}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='permissions'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-medium'>{t('admin.permission.permissions.title')}</CardTitle>
              <CardDescription>{t('admin.permission.permissions.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <QueryState
                isLoading={permissionsQuery.isLoading}
                error={permissionsQuery.error}
                onRetry={() => void permissionsQuery.refetch()}
                isRetrying={permissionsQuery.isRefetching}
              >
                {permissions.length === 0 && (
                  <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin.common.noData')}</p>
                )}
                <div className='rounded-md border'>
                  <ScrollArea className='h-[calc(100vh-320px)]'>
                    <div className='grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3'>
                      {permissions.map((permission: any) => (
                        <button
                          type='button'
                          key={permission.id}
                          className='group relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring'
                          onClick={() => openPermissionDialog(permission)}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-xs font-semibold'>{permission.displayName}</span>
                            {permission.category && (
                              <Badge variant='outline' className='h-4 px-1 py-0 text-[9px]'>
                                {permission.category}
                              </Badge>
                            )}
                          </div>
                          <code className='mt-1 font-mono text-xs font-bold text-primary'>{permission.code}</code>
                          {permission.isSystem && (
                            <div className='absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100'>
                              <Shield className='h-3 w-3 text-muted-foreground' />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </QueryState>
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
