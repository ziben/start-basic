import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Building2, Key, Calendar, CheckCircle2 } from 'lucide-react'
import type { UserProfileData } from '~/modules/demo/shared/server-fns/profile.fn'

interface OrganizationRolesCardProps {
  profile: UserProfileData
}

export function OrganizationRolesCard({ profile }: OrganizationRolesCardProps) {
  const { organizationRoles } = profile

  if (organizationRoles.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>组织角色</CardTitle>
        </div>
        <CardDescription>在各个组织中的角色和权限</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {organizationRoles.map((orgRole) => (
          <div key={orgRole.organization.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={orgRole.organization.logo || undefined} />
                  <AvatarFallback>
                    {orgRole.organization.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{orgRole.organization.name}</h4>
                  {orgRole.organization.slug && (
                    <p className="text-sm text-muted-foreground">
                      @{orgRole.organization.slug}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {orgRole.role && (
                  <Badge variant={orgRole.role.isSystem ? 'default' : 'secondary'}>
                    {orgRole.role.displayName}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(orgRole.joinedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {orgRole.role?.description && (
              <p className="text-sm text-muted-foreground pl-13">
                {orgRole.role.description}
              </p>
            )}

            {orgRole.permissions.length > 0 && (
              <div className="pl-13">
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  组织权限 ({orgRole.permissions.length})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {orgRole.permissions.map((perm) => (
                    <div
                      key={perm.code}
                      className="flex items-start gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{perm.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {perm.resource} · {perm.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
