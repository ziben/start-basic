import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { AppHeaderMain } from "@/components/layout/app-header-main"
import { PageHeader } from "@/components/layout/page-header"
import { OrgRolesProvider, useOrgRolesContext } from "./context/org-roles-context"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Users, ShieldCheck, MoreVertical, Edit2, Trash2, Shield, Search } from "lucide-react"
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
import { OrgRolesToolbar } from "./components/org-roles-toolbar"
import { DataTablePagination } from "@/components/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { OrganizationSelect } from "./components/organization-select"

function OrgRolesContent() {
  const { t } = useTranslation()
  const { openMutateDialog, openDeleteDialog, openPermissionsDialog, tableUrl } = useOrgRolesContext()
  const organizationId = tableUrl.columnFilters.find(f => f.id === "organizationId")?.value as string
  
  const { data: orgRolesData, isLoading, refetch, isRefetching } = useOrgRolesQuery({
    organizationId,
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    search: tableUrl.globalFilter,
  })

  const roles = orgRolesData?.data || []
  const totalPages = orgRolesData?.pagination?.totalPages || 1

  return (
    <AppHeaderMain>
      <PageHeader title={t('admin.orgRole.title')} description={t('admin.orgRole.desc')}>
        <Button onClick={() => openMutateDialog()} disabled={!organizationId}>
          <Plus className="mr-2 h-4 w-4" /> {t('admin.orgRole.button.create')}
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <OrgRolesToolbar 
            onReload={() => void refetch()} 
            isReloading={isRefetching} 
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t('admin.orgRole.filter.organization')}
            </span>
            <OrganizationSelect 
              value={organizationId} 
              onValueChange={(id) => {
                tableUrl.onColumnFiltersChange([
                  { id: "organizationId", value: id }
                ])
              }}
            />
          </div>
        </div>

        {!organizationId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t('admin.orgRole.empty.noOrganization.title')}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                {t('admin.orgRole.empty.noOrganization.desc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-10 w-full mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : roles.length === 0 ? (
                <div className="col-span-full border rounded-lg border-dashed py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-10 w-10 mb-4 opacity-20" />
                  <p>{t('admin.orgRole.empty.noResults')}</p>
                </div>
              ) : (
                roles.map((role: any) => (
                  <Card key={role.id} className="group hover:shadow-md transition-all duration-200 border-sidebar-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                            <ShieldCheck className="h-5 w-5 text-primary/70" />
                            {role.displayName}
                          </CardTitle>
                          <CardDescription className="font-mono text-[10px] uppercase tracking-wider">{role.role}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={role.isActive ? "default" : "secondary"} className="h-5 text-[10px]">
                            {role.isActive ? t('admin.orgRole.status.active') : t('admin.orgRole.status.inactive')}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openMutateDialog(role)}>
                                <Edit2 className="mr-2 h-4 w-4" /> {t('admin.orgRole.actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPermissionsDialog(role)}>
                                <Shield className="mr-2 h-4 w-4" /> {t('admin.orgRole.actions.permissions')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(role)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> {t('admin.orgRole.actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
                          {role.description || t('admin.orgRole.description.empty')}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{role._count?.members || 0}</span>
                            {t('admin.orgRole.labels.members')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{role._count?.permissions || 0}</span>
                            {t('admin.orgRole.labels.permissions')}
                          </div>
                        </div>
                        {role.templateRole && (
                          <div className="pt-3 border-t border-dashed">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{t('admin.orgRole.inherit.template')}</span>
                              <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] font-normal bg-primary/5 border-primary/20 text-primary">
                                {role.templateRole.displayName}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {roles.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <DataTablePagination 
                  table={{
                    getState: () => ({
                      pagination: tableUrl.pagination,
                    }),
                    setPagination: tableUrl.onPaginationChange,
                    getPageCount: () => totalPages,
                    getCanPreviousPage: () => tableUrl.pagination.pageIndex > 0,
                    getCanNextPage: () => tableUrl.pagination.pageIndex < totalPages - 1,
                    previousPage: () => tableUrl.onPaginationChange?.({ ...tableUrl.pagination, pageIndex: tableUrl.pagination.pageIndex - 1 }),
                    nextPage: () => tableUrl.onPaginationChange?.({ ...tableUrl.pagination, pageIndex: tableUrl.pagination.pageIndex + 1 }),
                    setPageIndex: (index: number) => tableUrl.onPaginationChange?.({ ...tableUrl.pagination, pageIndex: index }),
                    setPageSize: (size: number) => tableUrl.onPaginationChange?.({ ...tableUrl.pagination, pageSize: size }),
                  } as any}
                />
              </div>
            )}
          </div>
        )}
      </div>
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