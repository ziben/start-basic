import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AdminUser } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'

interface Props {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly currentRow: AdminUser
}

export function AdminUserDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return
    // TODO: 调用API删除
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <IconAlertTriangle className='stroke-destructive' size={18} /> {t('admin.user.dialog.delete')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.user.dialog.delete.confirm')} <span className='font-bold'>{currentRow.username}</span>?
            <br />
            {t('admin.user.dialog.delete.cannotUndo')}
          </DialogDescription>
        </DialogHeader>
        <div className='my-4'>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('admin.user.dialog.delete.input')}
          />
        </div>
        <DialogFooter>
          <Button variant='destructive' onClick={handleDelete} disabled={value.trim() !== currentRow.username}>
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 