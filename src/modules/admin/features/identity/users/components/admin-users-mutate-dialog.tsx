import { useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useRoles } from '~/modules/admin/shared/hooks/use-role-api'
import { createUserFn, updateUserFn } from '../../../../shared/server-fns/user.fn'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { type AdminUser } from '../data/schema'

type AdminUserMutateDialogProps = {
  currentRow?: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUsersMutateDialog({ currentRow, open, onOpenChange }: AdminUserMutateDialogProps) {
  const isEdit = !!currentRow
  const { t } = useTranslation()
  const { data: rolesData } = useRoles({ page: 1, pageSize: 100 })
  const roles = (rolesData?.items ?? []) as Array<{ id: string; name: string; displayName: string }>

  const formSchema = useMemo(() => {
    return z.object({
      name: z.string().min(1, t('admin.user.form.validation.nameRequired')),
      email: z.string().email(t('admin.user.form.validation.emailRequired')),
      password: isEdit
        ? z.string().default('')
        : z.string().min(8, t('admin.user.form.validation.passwordMin')),
      username: z.string().default(''),
      role: z.string().default(''),
      banned: z.boolean().default(false),
      banReason: z.string().default(''),
      banExpires: z.string().default(''),
    })
  }, [isEdit, t])

  type AdminUserForm = z.infer<typeof formSchema>

  const toFormValues = useCallback((row?: AdminUser): AdminUserForm => {
    return {
      name: row?.name ?? '',
      email: row?.email ?? '',
      password: '',
      username: row?.username ?? '',
      role: row?.role ?? '',
      banned: row?.banned ?? false,
      banReason: row?.banReason ?? '',
      banExpires: row?.banExpires ? new Date(String(row.banExpires)).toISOString() : '',
    }
  }, [])

  const form = useForm<AdminUserForm>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: useMemo(() => toFormValues(currentRow), [currentRow, toFormValues]),
  })

  // 同步重置表单
  useEffect(() => {
    if (open) {
      form.reset(toFormValues(currentRow))
    }
  }, [open, currentRow, form, toFormValues])

  // Watch the banned field to conditionally show ban-related fields
  const banned = useWatch({
    control: form.control,
    name: 'banned',
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      if (!data.password) {
        throw new Error(t('admin.user.form.validation.passwordRequired'))
      }

      return await createUserFn({
        data: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role || undefined,
          username: data.username ? data.username : undefined,
          banned: data.banned,
        }
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      if (!currentRow) {
        throw new Error(t('admin.user.errors.missingCurrent'))
      }

      return await updateUserFn({
        data: {
          id: currentRow.id,
          name: data.name,
          username: data.username ? data.username : null,
          role: data.role || null,
          banned: data.banned,
          banReason: data.banned ? (data.banReason ? data.banReason : null) : null,
          banExpires: data.banned ? (data.banExpires ? data.banExpires : null) : null,
        }
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all })
      onOpenChange(false)
      form.reset()
    },
  })

  const onSubmit = (data: AdminUserForm) => {
    if (!isEdit && (!data.password || data.password.length < 8)) {
      form.setError('password', { message: t('admin.user.form.validation.passwordMinNew') })
      return
    }

    const promise = isEdit ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)

    toast.promise(promise, {
      loading: isEdit ? t('admin.user.toast.update.loading') : t('admin.user.toast.create.loading'),
      success: isEdit ? t('admin.user.toast.update.success') : t('admin.user.toast.create.success'),
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
          <DialogTitle>{isEdit ? t('admin.user.dialog.edit') : t('admin.user.dialog.create')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('admin.user.dialog.update') : t('admin.user.dialog.createDesc')}
            {t('admin.user.dialog.saveHint')}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] overflow-y-auto py-1'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 px-0.5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.user.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.user.form.namePlaceholder')}
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
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.user.form.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.user.form.emailPlaceholder')}
                        className='col-span-4'
                        {...field}
                        disabled={isEdit}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {!isEdit ? (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>{t('admin.user.form.password')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('admin.user.form.passwordPlaceholder')}
                          className='col-span-4'
                          type='password'
                          autoComplete='off'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.user.form.username')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('admin.user.form.usernamePlaceholder')}
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
                name='role'
                render={() => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end pt-2'>{t('admin.user.form.role')}</FormLabel>
                    <div className='col-span-4 grid grid-cols-2 gap-2'>
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={form.control}
                          name='role'
                          render={({ field }) => {
                            const currentRoles = field.value ? field.value.split(',').filter(Boolean) : []
                            return (
                              <FormItem
                                key={role.id}
                                className='flex flex-row items-start space-x-3 space-y-0'
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={currentRoles.includes(role.name)}
                                    onCheckedChange={(checked) => {
                                      const nextRoles = checked
                                        ? [...currentRoles, role.name]
                                        : currentRoles.filter((r) => r !== role.name)
                                      field.onChange(nextRoles.join(','))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className='font-normal cursor-pointer'>
                                  {role.displayName}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='banned'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>{t('admin.user.form.banned')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(v) => field.onChange(v === 'true')}
                        defaultValue={String(field.value)}
                        className='col-span-4 flex gap-4'
                      >
                        <FormItem className='flex items-center space-y-0 space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='true' />
                          </FormControl>
                          <FormLabel className='font-normal'>{t('common.yes')}</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-y-0 space-x-2'>
                          <FormControl>
                            <RadioGroupItem value='false' />
                          </FormControl>
                          <FormLabel className='font-normal'>{t('common.no')}</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {banned && (
                <>
                  <FormField
                    control={form.control}
                    name='banReason'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>{t('admin.user.form.banReason')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.user.form.banReasonPlaceholder')}
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
                    name='banExpires'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>{t('admin.user.form.banExpires')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.user.form.banExpiresPlaceholder')}
                            className='col-span-4'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={updateMutation.isPending || createMutation.isPending}>
            {t('common.buttons.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}






