import { z } from 'zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Translation } from '~/generated/prisma/client'
import { toast } from 'sonner'
import { useTranslation } from '~/hooks/useTranslation'
import { useCreateTranslation, useUpdateTranslation } from '~/hooks/useTranslationApi'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type TranslationsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Translation | null
}

const formSchema = z.object({
  locale: z.string().min(2, 'Locale is required'),
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(0).optional(),
})

type TranslationForm = z.infer<typeof formSchema>

export function TranslationsMutateDrawer({ open, onOpenChange, currentRow }: TranslationsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const createMutation = useCreateTranslation()
  const updateMutation = useUpdateTranslation()
  const { t } = useTranslation()

  const form = useForm<TranslationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locale: currentRow?.locale ?? '',
      key: currentRow?.key ?? '',
      value: currentRow?.value ?? '',
    },
  })

  // keep form in sync when currentRow or open changes
  useEffect(() => {
    if (open && currentRow) {
      form.reset({ locale: currentRow.locale, key: currentRow.key, value: currentRow.value })
    }
    if (!open) {
      form.reset({ locale: '', key: '', value: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentRow])

  const onSubmit = async (data: TranslationForm) => {
    try {
      if (isUpdate && currentRow) {
        await updateMutation.mutateAsync({ id: currentRow.id, value: data.value ?? '' })
        toast.success(t('admin.translation.toast.updateSuccess') || 'Updated')
      } else {
        await createMutation.mutateAsync({ locale: data.locale, key: data.key, value: data.value ?? '' })
        toast.success(t('admin.translation.toast.createSuccess') || 'Created')
      }
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      console.error(err)
      toast.error(isUpdate ? t('admin.translation.toast.updateError') || 'Update failed' : t('admin.translation.toast.createError') || 'Create failed')
    }
  }

  const isSubmitting = (createMutation as any).status === 'loading' || (updateMutation as any).status === 'loading'

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? t('admin.translation.dialog.editTitle') : t('admin.translation.dialog.createTitle')}</SheetTitle>
          <SheetDescription>
            {isUpdate ? t('admin.translation.dialog.editTitle') : t('admin.translation.dialog.createTitle')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form id='translations-form' onSubmit={form.handleSubmit(onSubmit)} className='flex-1 space-y-6 overflow-y-auto px-4'>
            <FormField
              control={form.control}
              name='locale'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.translation.form.locale') || 'Locale'}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.translation.form.localePlaceholder') || 'en'} {...field} disabled={isUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='key'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.translation.form.key') || 'Key'}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.translation.form.keyPlaceholder') || 'namespace.key'} {...field} disabled={isUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='value'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.translation.form.value') || 'Value'}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('admin.translation.form.valuePlaceholder') || 'Translated string'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline' disabled={isSubmitting}>{t('common.cancel')}</Button>
          </SheetClose>
          <Button form='translations-form' type='submit' disabled={isSubmitting}>
            {isSubmitting ? (t('common.saving') || 'Saving...') : t('common.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}