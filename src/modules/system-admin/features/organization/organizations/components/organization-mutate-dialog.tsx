import { useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createOrganizationFn, updateOrganizationFn } from '../../../../shared/server-fns/organization.fn'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import { type Organization } from '../data/schema'

type OrganizationMutateDialogProps = {
  currentRow?: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrganizationMutateDialog({ currentRow, open, onOpenChange }: OrganizationMutateDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!currentRow

  const formSchema = useMemo(() => {
    return z.object({
      name: z
        .string()
        .min(1, t('admin.organization.form.validation.nameRequired'))
        .max(100, t('admin.organization.form.validation.nameMax')),
      slug: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^[a-z0-9-]+$/.test(val),
          t('admin.organization.form.validation.slugFormat')
        ),
      logo: z.string().optional(),
      metadata: z.string().optional(),
    })
  }, [t])

  type OrganizationForm = z.infer<typeof formSchema>

  const toFormValues = useCallback((row?: Organization): OrganizationForm => {
    return {
      name: row?.name ?? '',
      slug: row?.slug ?? '',
      logo: row?.logo ?? '',
      metadata: row?.metadata ?? '',
    }
  }, [])

  const form = useForm<OrganizationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => toFormValues(currentRow), [currentRow, toFormValues]),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(currentRow))
    }
  }, [open, currentRow, form, toFormValues])

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      return await createOrganizationFn({ data })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      if (!currentRow) {
        throw new Error(t('admin.organization.errors.missingCurrent'))
      }

      return await updateOrganizationFn({
        data: {
          id: currentRow.id,
          name: data.name,
          slug: data.slug,
          logo: data.logo,
          metadata: data.metadata,
        }
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: OrganizationForm) => {
    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? t('admin.organization.toast.save.loading') : t('admin.organization.toast.create.loading'),
      success: isEdit ? t('admin.organization.toast.save.success') : t('admin.organization.toast.create.success'),
      error: (error) => {
        return getErrorMessage(error)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? t('admin.organization.dialog.editTitle') : t('admin.organization.dialog.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('admin.organization.dialog.editDesc') : t('admin.organization.dialog.createDesc')}
            {t('admin.organization.dialog.saveHint')}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='organization-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.organization.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.organization.form.namePlaceholder')}
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.organization.form.slug')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.organization.form.slugPlaceholder')}
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='logo'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.organization.form.logo')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.organization.form.logoPlaceholder')}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='metadata'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end pt-2'>{t('admin.organization.form.metadata')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('admin.organization.form.metadataPlaceholder')}
                        rows={3}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            {t('common.buttons.cancel')}
          </Button>
          <Button type='submit' form='organization-form'>
            {isEdit ? t('common.buttons.save') : t('common.buttons.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
