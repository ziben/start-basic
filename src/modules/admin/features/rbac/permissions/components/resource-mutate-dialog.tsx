import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createResourceFn, updateResourceFn, deleteResourceFn } from '../../server-fns/rbac.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { rbacResourcesQueryKeys } from '~/shared/lib/query-keys'
import { usePermissionsContext } from '../context/permissions-context'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function ResourceMutateDialog() {
  const { t } = useTranslation()
  const { resourceDialog, closeResourceDialog } = usePermissionsContext()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const formSchema = z.object({
    name: z.string().min(1, t('admin.permission.resource.validation.nameRequired')),
    displayName: z.string().min(1, t('admin.permission.resource.validation.displayNameRequired')),
    description: z.string().optional(),
    scope: z.enum(['GLOBAL', 'ORGANIZATION', 'BOTH']),
  })

  type FormValues = z.infer<typeof formSchema>

  const isEdit = !!resourceDialog.data?.id
  const resource = resourceDialog.data

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      scope: 'BOTH',
    },
  })

  useEffect(() => {
    if (resourceDialog.isOpen) {
      if (isEdit && resource) {
        form.reset({
          name: resource.name,
          displayName: resource.displayName,
          description: resource.description || '',
          scope: resource.scope as 'GLOBAL' | 'ORGANIZATION' | 'BOTH',
        })
      } else {
        form.reset({
          name: '',
          displayName: '',
          description: '',
          scope: 'BOTH',
        })
      }
    }
  }, [resourceDialog.isOpen, isEdit, resource, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createResourceFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.resource.toast.createSuccess'))
      closeResourceDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.resource.toast.createError'), { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!resource?.id) throw new Error(t('admin.permission.resource.errors.missingId'))
      return updateResourceFn({
        data: {
          id: resource.id,
          displayName: data.displayName,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.resource.toast.updateSuccess'))
      closeResourceDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.resource.toast.updateError'), { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!resource?.id) throw new Error(t('admin.permission.resource.errors.missingId'))
      return deleteResourceFn({ data: { id: resource.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.resource.toast.deleteSuccess'))
      setIsConfirmOpen(false)
      closeResourceDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.resource.toast.deleteError'), { description: error.message })
    },
  })

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <>
      <Dialog open={resourceDialog.isOpen} onOpenChange={closeResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>
                {isEdit ? t('admin.permission.resource.dialog.editTitle') : t('admin.permission.resource.dialog.createTitle')}
              </DialogTitle>
              {isEdit && !resource?.isSystem && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:bg-destructive/10'
                  onClick={() => setIsConfirmOpen(true)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              )}
            </div>
            <DialogDescription>{t('admin.permission.resource.dialog.desc')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.resource.form.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.resource.form.namePlaceholder')} disabled={isEdit} />
                    </FormControl>
                    <FormDescription>{t('admin.permission.resource.form.nameHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.resource.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.resource.form.displayNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='scope'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.resource.form.scope')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.permission.resource.form.scopePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='GLOBAL'>{t('admin.permission.resource.scope.global')}</SelectItem>
                        <SelectItem value='ORGANIZATION'>{t('admin.permission.resource.scope.organization')}</SelectItem>
                        <SelectItem value='BOTH'>{t('admin.permission.resource.scope.both')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.resource.form.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t('admin.permission.resource.form.descriptionPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeResourceDialog}>
                  {t('common.buttons.cancel')}
                </Button>
                <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
                  {isEdit ? t('common.buttons.save') : t('common.buttons.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('admin.permission.resource.confirmDelete.title')}
        desc={
          <>
            {t('admin.permission.resource.confirmDelete.desc', { name: resource?.displayName })}
          </>
        }
        destructive
        handleConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
