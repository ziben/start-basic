import { useSuspenseQuery } from '@tanstack/react-query'
import { userQueryKeys } from '~/shared/lib/query-keys'
import { getUserProfileFn } from '~/modules/demo/shared/server-fns/profile.fn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import {
  ProfileHeader,
  GlobalRoleCard,
  OrganizationRolesCard,
  PermissionStatsCard,
} from './components'

export function Profile() {
  const { data: profile } = useSuspenseQuery({
    queryKey: userQueryKeys.profile,
    queryFn: () => getUserProfileFn(),
  })

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>未登录</CardTitle>
            </div>
            <CardDescription>请先登录以查看您的权限信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/sign-in">前往登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <ProfileHeader profile={profile} />
      <GlobalRoleCard profile={profile} />
      <OrganizationRolesCard profile={profile} />
      <PermissionStatsCard profile={profile} />
    </div>
  )
}
