import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { UserProfileData } from '~/modules/demo/shared/server-fns/profile.fn'

interface PermissionStatsCardProps {
  profile: UserProfileData
}

export function PermissionStatsCard({ profile }: PermissionStatsCardProps) {
  const { globalPermissions, organizationRoles, stats } = profile

  return (
    <Card>
      <CardHeader>
        <CardTitle>权限统计</CardTitle>
        <CardDescription>当前用户的权限概览</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">全局权限</span>
            <Badge variant="outline">{globalPermissions.length} 个</Badge>
          </div>
          {organizationRoles.map((orgRole) => (
            <div key={orgRole.organization.id} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {orgRole.organization.name} 权限
              </span>
              <Badge variant="outline">{orgRole.permissions.length} 个</Badge>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between items-center font-semibold">
            <span>总计</span>
            <Badge className="text-base px-3 py-1">{stats.totalPermissions} 个权限</Badge>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            当前全局角色: {stats.globalRoles}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
