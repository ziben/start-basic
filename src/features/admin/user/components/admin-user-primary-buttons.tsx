import { Button } from '@/components/ui/button'
import { IconUserPlus } from '@tabler/icons-react'
import { useTranslation } from '~/hooks/useTranslation'
import { useAdminUser } from '../context/admin-user-context'

export default function AdminUserPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useAdminUser()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>{t('admin.user.add')}</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
} 