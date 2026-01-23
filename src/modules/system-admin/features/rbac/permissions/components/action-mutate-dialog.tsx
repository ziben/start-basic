import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActionFn, updateActionFn, deleteActionFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
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
import { toast } from 'sonner'
import { rbacResourcesQueryKeys } from '~/shared/lib/query-keys'
import { usePermissionsContext } from '../context/permissions-context'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function ActionMutateDialog() {
  const { t } = useTranslation()
  const { actionDialog, closeActionDialog } = usePermissionsContext()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const formSchema = z.object({
    name: z.string().min(1, t('admin.permission.action.validation.nameRequired')),
    displayName: z.string().min(1, t('admin.permission.action.validation.displayNameRequired')),
    description: z.string().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const resourceId = actionDialog.data?.resourceId
  const action = actionDialog.data?.action
  const isEdit = !!action?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
    },
  })

  useEffect(() => {
    if (actionDialog.isOpen) {
      if (isEdit && action) {
        form.reset({
          name: action.name,
          displayName: action.displayName,
          description: action.description || '',
        })
      } else {
        form.reset({
          name: '',
          displayName: '',
          description: '',
        })
      }
    }
  }, [actionDialog.isOpen, isEdit, action, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!resourceId) throw new Error(t('admin.permission.action.errors.missingResourceId'))
      return createActionFn({ 
        data: { 
          ...data,
          resourceId 
        } 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.action.toast.createSuccess'))
      closeActionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.action.toast.createError'), { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!action?.id) throw new Error(t('admin.permission.action.errors.missingId'))
      return updateActionFn({
        data: {
          id: action.id,
          displayName: data.displayName,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.action.toast.updateSuccess'))
      closeActionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.action.toast.updateError'), { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!action?.id) throw new Error(t('admin.permission.action.errors.missingId'))
      return deleteActionFn({ data: { id: action.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacResourcesQueryKeys.all })
      toast.success(t('admin.permission.action.toast.deleteSuccess'))
      setIsConfirmOpen(false)
      closeActionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.action.toast.deleteError'), { description: error.message })
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
      <Dialog open={actionDialog.isOpen} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>
                {isEdit ? t('admin.permission.action.dialog.editTitle') : t('admin.permission.action.dialog.createTitle')}
              </DialogTitle>
              {isEdit && !action?.isSystem && (
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
            <DialogDescription>{t('admin.permission.action.dialog.desc')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.action.form.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.action.form.namePlaceholder')} disabled={isEdit} />
                    </FormControl>
                    <FormDescription>{t('admin.permission.action.form.nameHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.action.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.action.form.displayNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.action.form.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.action.form.descriptionPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeActionDialog}>
                  {t('common.buttons.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
        title={t('admin.permission.action.confirmDelete.title')}
        desc={
          <>
            {t('admin.permission.action.confirmDelete.desc', { name: action?.displayName })}
          </>
        }
        destructive
        handleConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
