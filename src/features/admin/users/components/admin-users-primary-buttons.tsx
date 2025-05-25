import { Button } from '@/components/ui/button'
import { IconUserPlus } from '@tabler/icons-react'
import { useTranslation } from '~/hooks/useTranslation'
import { useAdminUsers } from '../context/admin-users-context'

export default function AdminUsersPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useAdminUsers()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>{t('admin.users.add')}</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
} 