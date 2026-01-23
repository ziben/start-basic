import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRoleFn, updateRoleFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { roleQueryKeys } from '~/shared/lib/query-keys'
import { useRolesContext } from '../context/roles-context'

export function RoleMutateDialog() {
  const { t } = useTranslation()
  const { editDialog, closeEditDialog, createDialog, closeCreateDialog } = useRolesContext()
  const queryClient = useQueryClient()

  const formSchema = z.object({
    name: z.string().min(1, t('admin.role.validation.nameRequired')),
    displayName: z.string().min(1, t('admin.role.validation.displayNameRequired')),
    description: z.string().optional(),
    scope: z.enum(['GLOBAL', 'ORGANIZATION', 'CUSTOM']),
    category: z.string().optional(),
    isTemplate: z.boolean(),
    isActive: z.boolean(),
  })

  type FormValues = z.infer<typeof formSchema>

  const isEdit = editDialog.isOpen
  const isCreate = createDialog.isOpen
  const role = editDialog.role

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      scope: 'CUSTOM',
      category: '',
      isTemplate: false,
      isActive: true,
    },
  })

  useEffect(() => {
    if (isEdit && role) {
      form.reset({
        name: role.name,
        displayName: role.displayName,
        description: role.description || '',
        scope: role.scope as 'GLOBAL' | 'ORGANIZATION' | 'CUSTOM',
        category: role.category || '',
        isTemplate: role.isTemplate,
        isActive: role.isActive,
      })
    } else if (isCreate) {
      form.reset({
        name: '',
        displayName: '',
        description: '',
        scope: 'CUSTOM',
        category: '',
        isTemplate: false,
        isActive: true,
      })
    }
  }, [isEdit, isCreate, role, form])

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await createRoleFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success(t('admin.role.toast.createSuccess'))
      closeCreateDialog()
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(t('admin.role.toast.createError'), { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!role) throw new Error(t('admin.role.errors.notFound'))
      return await updateRoleFn({
        data: {
          id: role.id,
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success(t('admin.role.toast.updateSuccess'))
      closeEditDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.role.toast.updateError'), { description: error.message })
    },
  })

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleClose = () => {
    if (isEdit) {
      closeEditDialog()
    } else {
      closeCreateDialog()
    }
    form.reset()
  }

  return (
    <Dialog open={isEdit || isCreate} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.role.dialog.editTitle') : t('admin.role.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('admin.role.dialog.editDesc') : t('admin.role.dialog.createDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.role.form.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('admin.role.form.namePlaceholder')} disabled={isEdit} />
                  </FormControl>
                  <FormDescription>{t('admin.role.form.nameHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.role.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('admin.role.form.displayNamePlaceholder')} />
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
                  <FormLabel>{t('admin.role.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('admin.role.form.descriptionPlaceholder')} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.role.form.scope')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.role.form.scopePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GLOBAL">{t('admin.role.scope.global')}</SelectItem>
                        <SelectItem value="ORGANIZATION">{t('admin.role.scope.organization')}</SelectItem>
                        <SelectItem value="CUSTOM">{t('admin.role.scope.custom')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.role.form.category')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.role.form.categoryPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('admin.role.form.template')}</FormLabel>
                      <FormDescription>{t('admin.role.form.templateDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('admin.role.form.active')}</FormLabel>
                      <FormDescription>{t('admin.role.form.activeDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
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
  )
}
