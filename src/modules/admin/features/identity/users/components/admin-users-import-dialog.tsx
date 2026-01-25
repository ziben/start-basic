import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { showSubmittedData } from '@/shared/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type AdminUserImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUserImportDialog({ open, onOpenChange }: AdminUserImportDialogProps) {
  const { t } = useTranslation()
  const formSchema = useMemo(() => {
    const fileSchema = z
      .custom<FileList>((files) => {
        return !!files && typeof (files as FileList).length === 'number'
      }, t('admin.user.import.validation.required'))
      .refine((files) => files.length > 0, {
        message: t('admin.user.import.validation.required'),
      })
      .refine((files) => ['text/csv'].includes(files?.[0]?.type), t('admin.user.import.validation.csv'))

    return z.object({
      file: fileSchema,
    })
  }, [t])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { file: undefined },
  })

  const fileRef = form.register('file')

  const onSubmit = () => {
    const file = form.getValues('file')

    if (file && file[0]) {
      const fileDetails = {
        name: file[0].name,
        size: file[0].size,
        type: file[0].type,
      }
      showSubmittedData(fileDetails, t('admin.user.import.submitted'))
    }
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        form.reset()
      }}
    >
      <DialogContent className='gap-2 sm:max-w-sm'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('admin.user.import.title')}</DialogTitle>
          <DialogDescription>{t('admin.user.import.desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='admin-user-import-form' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='file'
              render={() => (
                <FormItem className='my-2'>
                  <FormLabel>{t('admin.user.import.file')}</FormLabel>
                  <FormControl>
                    <Input type='file' {...fileRef} className='h-8 py-0' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline'>{t('common.buttons.cancel')}</Button>
          </DialogClose>
          <Button type='submit' form='admin-user-import-form'>
            {t('admin.user.import.button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



