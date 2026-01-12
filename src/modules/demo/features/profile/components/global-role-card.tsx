import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Shield, Key, CheckCircle2, Search, Filter } from 'lucide-react'
import type { UserProfileData, PermissionInfo } from '~/modules/demo/shared/server-fns/profile.fn'

interface GlobalRoleCardProps {
  profile: UserProfileData
}

export function GlobalRoleCard({ profile }: GlobalRoleCardProps) {
  const { globalRoles, globalPermissions } = profile
  const [searchTerm, setSearchTerm] = useState('')

  // 按分类分组并过滤
  const groupedPermissions = useMemo(() => {
    const filtered = globalPermissions.filter(perm => 
      perm.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.resource.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filtered.reduce((acc, perm) => {
      const category = perm.category || '其他'
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {} as Record<string, PermissionInfo[]>)
  }, [globalPermissions, searchTerm])

  const categories = Object.keys(groupedPermissions).sort()

  return (
    <Card className='shadow-sm'>
      <CardHeader className='pb-3'>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>全局角色</CardTitle>
              <CardDescription>系统级别的角色和权限配置</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {globalRoles && globalRoles.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {globalRoles.map((role) => (
                <div key={role.id} className="group relative flex items-center gap-2 p-1 pr-3 border rounded-full bg-muted/30 hover:bg-muted transition-colors">
                  <Badge variant={role.isSystem ? 'default' : 'secondary'} className="rounded-full px-3">
                    {role.displayName}
                  </Badge>
                  {role.isSystem && <Badge variant="outline" className='text-[10px] h-5'>系统</Badge>}
                  {role.description && (
                    <span className='text-xs text-muted-foreground truncate max-w-[200px]'>
                      {role.description}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  权限明细 ({globalPermissions.length})
                </h4>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="搜索权限名称、代码..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {categories.length > 0 ? (
                <div className='space-y-6'>
                  {categories.map(category => (
                    <div key={category} className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                        <h5 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                          {category} ({groupedPermissions[category].length})
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupedPermissions[category].map((perm) => (
                          <div
                            key={perm.code}
                            className="group flex items-start gap-3 p-3 border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                          >
                            <div className='mt-0.5 rounded-full p-1 bg-green-100 dark:bg-green-900/30'>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className='flex items-center justify-between gap-2'>
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {perm.displayName}
                                </p>
                              </div>
                              <code className='text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block'>
                                {perm.code}
                              </code>
                              <div className='flex items-center gap-2 mt-1.5'>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                  {perm.resource}
                                </Badge>
                                <span className='text-[10px] text-muted-foreground'>•</span>
                                <span className='text-[10px] text-muted-foreground font-medium'>
                                  {perm.action}
                                </span >
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-12 text-center border border-dashed rounded-xl'>
                  <Filter className='h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20' />
                  <p className='text-sm text-muted-foreground'>未找到匹配的权限</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className='py-8 text-center bg-muted/20 rounded-xl'>
            <Shield className='h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20' />
            <p className="text-sm text-muted-foreground font-medium">未分配全局角色</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
