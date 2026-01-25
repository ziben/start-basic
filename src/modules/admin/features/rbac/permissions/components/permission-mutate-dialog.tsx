import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPermissionFn, updatePermissionFn, deletePermissionFn } from '@/modules/admin/shared/server-fns/rbac.fn'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { rbacPermissionsQueryKeys } from '~/shared/lib/query-keys'
import { usePermissionsContext } from '../context/permissions-context'
import { useResourcesQuery } from '../hooks/use-permissions-queries'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function PermissionMutateDialog() {
  const { t } = useTranslation()
  const { permissionDialog, closePermissionDialog } = usePermissionsContext()
  const queryClient = useQueryClient()
  const { data: resources = [] } = useResourcesQuery()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const formSchema = z.object({
    resourceId: z.string().min(1, t('admin.permission.permission.validation.resourceRequired')),
    actionId: z.string().min(1, t('admin.permission.permission.validation.actionRequired')),
    displayName: z.string().min(1, t('admin.permission.permission.validation.displayNameRequired')),
    category: z.string().optional(),
    description: z.string().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const isEdit = !!permissionDialog.data?.id
  const permission = permissionDialog.data

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      description: '',
      resourceId: '',
      actionId: '',
      category: '',
    },
  })

  // 监听资源变化，重置操作
  const selectedResourceId = useWatch({
    control: form.control,
    name: 'resourceId',
  })
  const availableActions = resources.find((r: any) => r.id === selectedResourceId)?.actions || []

  useEffect(() => {
    if (permissionDialog.isOpen) {
      if (isEdit && permission) {
        form.reset({
          displayName: permission.displayName,
          description: permission.description || '',
          resourceId: permission.resourceId,
          actionId: permission.actionId,
          category: permission.category || '',
        })
      } else {
        form.reset({
          displayName: '',
          description: '',
          resourceId: '',
          actionId: '',
          category: '',
        })
      }
    }
  }, [permissionDialog.isOpen, isEdit, permission, form])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createPermissionFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
      toast.success(t('admin.permission.permission.toast.createSuccess'))
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.permission.toast.createError'), { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!permission?.id) throw new Error(t('admin.permission.permission.errors.missingId'))
      return updatePermissionFn({
        data: {
          id: permission.id,
          displayName: data.displayName,
          description: data.description,
          category: data.category,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
      toast.success(t('admin.permission.permission.toast.updateSuccess'))
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.permission.toast.updateError'), { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!permission?.id) throw new Error(t('admin.permission.permission.errors.missingId'))
      return deletePermissionFn({ data: { id: permission.id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
      toast.success(t('admin.permission.permission.toast.deleteSuccess'))
      setIsConfirmOpen(false)
      closePermissionDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.permission.permission.toast.deleteError'), { description: error.message })
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
      <Dialog open={permissionDialog.isOpen} onOpenChange={closePermissionDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>
                {isEdit
                  ? t('admin.permission.permission.dialog.editTitle')
                  : t('admin.permission.permission.dialog.createTitle')}
              </DialogTitle>
              {isEdit && !permission?.isSystem && (
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
            <DialogDescription>{t('admin.permission.permission.dialog.desc')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-2'>
              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.permission.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.permission.form.displayNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='resourceId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.permission.permission.form.resource')}</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue('actionId', '') // 切换资源时清空已选操作
                        }}
                        value={field.value}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.permission.permission.form.resourcePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {resources.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.displayName} ({r.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='actionId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.permission.permission.form.action')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEdit || !selectedResourceId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.permission.permission.form.actionPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableActions.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.displayName} ({a.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.permission.form.category')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.permission.form.categoryPlaceholder')} />
                    </FormControl>
                    <FormDescription>{t('admin.permission.permission.form.categoryHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.permission.permission.form.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.permission.permission.form.descriptionPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className='pt-4'>
                <Button type='button' variant='outline' onClick={closePermissionDialog}>
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
        title={t('admin.permission.permission.confirmDelete.title')}
        desc={
          <>
            {t('admin.permission.permission.confirmDelete.desc', { name: permission?.displayName })}
          </>
        }
        destructive
        handleConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
