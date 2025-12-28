import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  isLoading?: boolean
  className?: string
  confirmWord?: string
  itemCount?: number
  itemName?: string
  showWarningAlert?: boolean
  warningTitle?: string
  warningDescription?: string
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  className,
  confirmWord,
  itemCount = 1,
  itemName = 'item',
  showWarningAlert = true,
  warningTitle = 'Warning!',
  warningDescription = 'Please be careful, this operation can not be rolled back.',
}: ConfirmDeleteDialogProps) {
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    if (confirmWord && inputValue.trim() !== confirmWord) {
      toast.error(`Please type "${confirmWord}" to confirm.`)
      return
    }
    onConfirm()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue('')
    }
    onOpenChange(newOpen)
  }

  const isDisabled = isLoading || (confirmWord ? inputValue.trim() !== confirmWord : false)

  const defaultTitle = (
    <span className='text-destructive'>
      <AlertTriangle className='me-1 inline-block stroke-destructive' size={18} /> Delete {itemCount}{' '}
      {itemCount > 1 ? `${itemName}s` : itemName}
    </span>
  )

  const defaultDescription = (
    <>
      Are you sure you want to delete the selected {itemCount > 1 ? `${itemName}s` : itemName}? <br />
      This action cannot be undone.
    </>
  )

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader className='text-start'>
          <AlertDialogTitle>{title ?? defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-4'>
              <p className='mb-2'>{description ?? defaultDescription}</p>

              {confirmWord && (
                <Label className='my-4 flex flex-col items-start gap-1.5'>
                  <span>Confirm by typing "{confirmWord}":</span>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Type "${confirmWord}" to confirm.`}
                    disabled={isLoading}
                  />
                </Label>
              )}

              {showWarningAlert && (
                <Alert variant='destructive'>
                  <AlertTitle>{warningTitle}</AlertTitle>
                  <AlertDescription>{warningDescription}</AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <Button variant='destructive' onClick={handleConfirm} disabled={isDisabled}>
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


