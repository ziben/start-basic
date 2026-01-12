import { AppHeaderMain } from "@/components/layout/app-header-main"
import { OrgRolesProvider, useOrgRolesContext } from "./context/org-roles-context"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Users, ShieldCheck, MoreVertical, Edit2, Trash2, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOrgRolesQuery } from "./hooks/use-org-roles-queries"
import { OrgRolesDialogs } from "./components/org-roles-dialogs"

function OrgRolesContent() {
  const { openMutateDialog, openDeleteDialog, openPermissionsDialog, tableUrl } = useOrgRolesContext()
  const organizationId = tableUrl.columnFilters.find(f => f.id === "organizationId")?.value as string
  
  const { data: orgRolesData, isLoading } = useOrgRolesQuery({
    organizationId,
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    search: tableUrl.globalFilter,
  })

  const roles = orgRolesData?.data || []

  return (
    <AppHeaderMain>
      <div className="mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">组织角色管理</h2>
          <p className="text-muted-foreground">管理组织内的角色实例及其权限范围</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openMutateDialog()} disabled={!organizationId}>
            <Plus className="mr-2 h-4 w-4" /> 新增组织角色
          </Button>
        </div>
      </div>

      {!organizationId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">未选择组织</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              组织角色是特定于某个组织的。请先在组织列表中选择一个组织，或使用过滤器指定组织 ID。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">加载中...</div>
          ) : roles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">暂无组织角色</div>
          ) : (
            roles.map((role: any) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      {role.displayName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? "启用" : "禁用"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openMutateDialog(role)}>
                            <Edit2 className="mr-2 h-4 w-4" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPermissionsDialog(role)}>
                            <Shield className="mr-2 h-4 w-4" /> 分配权限
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(role)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> 删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="font-mono text-xs">{role.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {role.description || "暂无描述"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {role._count?.members || 0} 成员
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {role._count?.permissions || 0} 权限
                      </div>
                    </div>
                    {role.templateRole && (
                      <div className="pt-2 border-t mt-2">
                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                          模板: {role.templateRole.displayName}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      <OrgRolesDialogs />
    </AppHeaderMain>
  )
}

export default function OrgRolesPage() {
  return (
    <OrgRolesProvider>
      <OrgRolesContent />
    </OrgRolesProvider>
  )
}