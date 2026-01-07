/**
 * 组织角色管理页面
 */

import { useOrgRoles } from '~/modules/system-admin/shared/hooks/use-org-role-api'
import { useSession } from '~/modules/identity/shared/hooks/use-session'
import { OrgRolesTable } from './components/org-roles-table'
import { OrgRolesDialogs } from './components/org-roles-dialogs'
import { OrgRolesProvider } from './components/org-roles-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Shield } from 'lucide-react'

export function OrgRolesPage() {
    const { session } = useSession()
    const organizationId = session?.session?.activeOrganizationId

    const { data: roles, isLoading } = useOrgRoles(organizationId || '')

    if (!organizationId) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    请先选择一个组织
                </CardContent>
            </Card>
        )
    }

    return (
        <OrgRolesProvider organizationId={organizationId}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            组织角色管理
                        </h2>
                        <p className="text-muted-foreground">
                            管理组织内的角色和权限配置
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('org-role:create'))
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        创建角色
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>角色列表</CardTitle>
                        <CardDescription>
                            包括内置角色和自定义动态角色
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OrgRolesTable
                            roles={roles || []}
                            isLoading={isLoading}
                            organizationId={organizationId}
                        />
                    </CardContent>
                </Card>

                <OrgRolesDialogs organizationId={organizationId} />
            </div>
        </OrgRolesProvider>
    )
}
