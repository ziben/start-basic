import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslation } from '~/hooks/useTranslation'
import { showSubmittedData } from '@/lib/show-submitted-data'
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

const formSchema = z.object({
  file: z
    .any()
    .refine(
      (files) => {
        if (typeof window === 'undefined') return true // Skip validation on server
        return files && files.length > 0
      },
      {
        message: 'Please upload a file',
      }
    )
    .refine((files) => {
      if (typeof window === 'undefined') return true // Skip validation on server
      return files?.length > 0 && files[0] && ['text/csv'].includes(files[0].type)
    }, 'Please upload csv format.'),
})

type NavGroupsImportDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function NavGroupsImportDialog({ open, onOpenChange }: NavGroupsImportDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { file: undefined },
  })

  const { t } = useTranslation()

  const fileRef = form.register('file')

  const onSubmit = () => {
    const file = form.getValues('file')

    if (file?.[0]) {
      const fileDetails = {
        name: file[0].name,
        size: file[0].size,
        type: file[0].type,
      }
      showSubmittedData(fileDetails, t('admin.navgroup.import.success') || 'Imported file')
      toast.success(t('admin.navgroup.toast.exporting.success') || 'Imported')
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
          <DialogTitle>{t('admin.navgroup.import.title') || 'Import NavGroups'}</DialogTitle>
          <DialogDescription>
            {t('admin.navgroup.import.desc') || 'Import navgroups quickly from a CSV file.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='navgroup-import-form' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='file'
              render={() => (
                <FormItem className='my-2'>
                  <FormLabel>{t('admin.navgroup.import.file') || 'File'}</FormLabel>
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
            <Button variant='outline'>{t('common.cancel') || 'Close'}</Button>
          </DialogClose>
          <Button type='submit' form='navgroup-import-form'>
            {t('admin.navgroup.import.button') || 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
