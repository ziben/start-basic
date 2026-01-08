import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Building2, Key } from 'lucide-react'
import type { UserProfileData } from '~/modules/demo/shared/server-fns/profile.fn'

interface ProfileHeaderProps {
  profile: UserProfileData
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user, stats } = profile

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            <CardDescription className="text-base mt-1">
              {user.email}
              {user.username && <span className="ml-2">@{user.username}</span>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">全局角色</p>
              <p className="text-lg font-semibold">{stats.globalRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">总权限数</p>
              <p className="text-lg font-semibold">{stats.totalPermissions}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">所属组织</p>
              <p className="text-lg font-semibold">{stats.organizationCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
