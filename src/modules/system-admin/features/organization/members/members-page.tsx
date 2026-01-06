import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { MembersDialogs } from './components/members-dialogs'
import { MembersPrimaryButtons } from './components/members-primary-buttons'
import { MembersProvider } from './components/members-provider'
import { MembersTable } from './components/members-table'

export default function MembersPage() {
  const { t } = useTranslation()

  return (
    <MembersProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('admin.member.title', { defaultMessage: '成员管理' })}
            </h2>
            <p className='text-muted-foreground'>
              {t('admin.member.desc', { defaultMessage: '管理组织成员和角色' })}
            </p>
          </div>
          <MembersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <MembersTable />
        </div>
      </AppHeaderMain>

      <MembersDialogs />
    </MembersProvider>
  )
}
