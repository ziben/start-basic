import { useState } from 'react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import { getOrganizationsFn } from '~/modules/admin/features/organization/organizations/server-fns/organization.fn'
import { DepartmentsDialogs } from './components/departments-dialogs'
import { DepartmentsPrimaryButtons } from './components/departments-primary-buttons'
import { DepartmentsProvider } from './components/departments-provider'
import { DepartmentsList } from './components/departments-list'
import { useDepartmentsQuery } from './hooks/use-departments-query'

export default function DepartmentsPage() {
  const { t } = useTranslation()
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')

  const { data: orgsData } = useQuery({
    queryKey: organizationQueryKeys.list({ page: 1, pageSize: 100 }),
    queryFn: async () => {
      const result = await getOrganizationsFn({ data: { page: 1, pageSize: 100 } })
      return result
    },
  })

  const organizations = orgsData?.items ?? []

  // 默认选择第一个组织
  const orgId = selectedOrgId || organizations[0]?.id || ''

  const { departments, isLoading } = useDepartmentsQuery({
    organizationId: orgId,
  })

  return (
    <DepartmentsProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div className='flex items-center gap-4'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                {t('admin.department.title', { defaultMessage: '部门管理' })}
              </h2>
              <p className='text-muted-foreground'>
                {t('admin.department.desc', { defaultMessage: '管理组织部门结构' })}
              </p>
            </div>
            <Select value={orgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='选择组织' />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {orgId && <DepartmentsPrimaryButtons />}
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {isLoading ? (
            <div className='flex h-[400px] items-center justify-center'>
              <div className='text-muted-foreground'>加载中...</div>
            </div>
          ) : orgId ? (
            <DepartmentsList departments={departments} />
          ) : (
            <div className='flex h-[400px] items-center justify-center'>
              <div className='text-muted-foreground'>请选择组织</div>
            </div>
          )}
        </div>
      </AppHeaderMain>

      {orgId && <DepartmentsDialogs organizationId={orgId} departments={departments} />}
    </DepartmentsProvider>
  )
}
