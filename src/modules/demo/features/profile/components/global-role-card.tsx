import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Key, CheckCircle2 } from 'lucide-react'
import type { UserProfileData } from '~/modules/demo/shared/server-fns/profile.fn'

interface GlobalRoleCardProps {
  profile: UserProfileData
}

export function GlobalRoleCard({ profile }: GlobalRoleCardProps) {
  const { globalRole, globalPermissions } = profile

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>全局角色</CardTitle>
        </div>
        <CardDescription>系统级别的角色和权限</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {globalRole ? (
          <>
            <div className="flex items-center gap-3">
              <Badge variant={globalRole.isSystem ? 'default' : 'secondary'} className="text-base px-4 py-1">
                {globalRole.displayName}
              </Badge>
              {globalRole.isSystem && <Badge variant="outline">系统内置</Badge>}
            </div>
            {globalRole.description && (
              <p className="text-sm text-muted-foreground">{globalRole.description}</p>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                权限列表 ({globalPermissions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {globalPermissions.map((perm) => (
                  <div
                    key={perm.code}
                    className="flex items-start gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{perm.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {perm.resource} · {perm.action}
                      </p>
                      {perm.category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {perm.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">未分配全局角色</p>
        )}
      </CardContent>
    </Card>
  )
}
