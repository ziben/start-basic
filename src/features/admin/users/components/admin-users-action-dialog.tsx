import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Switch } from '@/components/ui/switch'
import { AdminUsers } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'
import { authClient } from '~/lib/auth-client'
import { useAdminUsers } from '../context/admin-users-context'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Props {
  readonly currentRow?: AdminUsers
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function AdminUsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const isEdit = !!currentRow

  // 可用的角色列表
  const availableRoles = [
    { id: 'admin', label: 'Admin' },
    { id: 'user', label: 'User' },
  ]

  // 定义表单schema
  const formSchema = z.object({
    name: z.string().min(1, { message: t('admin.user.table.name') + t('common.required') }),
    username: z.string().optional(),
    displayUsername: z.string().optional(),
    email: z.string().min(1, { message: t('admin.user.table.email') + t('common.required') }).email({ message: t('admin.user.table.email') + t('common.invalidFormat') }),
    role: z.array(z.string()).min(1, { message: t('admin.user.table.role') + t('common.required') }),
    banned: z.boolean().default(false),
    banReason: z.string().optional(),
    banExpires: z.string().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
        name: currentRow?.name ?? '',
        username: currentRow?.username ?? '',
        displayUsername: currentRow?.displayUsername ?? '',
        email: currentRow?.email ?? '',
        role: currentRow?.role ? [currentRow.role] : [],
        banned: currentRow?.banned ?? false,
        banReason: currentRow?.banReason ?? '',
        banExpires: currentRow?.banExpires ? new Date(currentRow.banExpires).toISOString().split('T')[0] : '',
      }
      : {
        name: '',
        username: '',
        displayUsername: '',
        email: '',
        role: ['user'],
        banned: false,
        banReason: '',
        banExpires: '',
      },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && currentRow) {
        // 编辑用户 - 简化为控制台输出
        toast.warning(t('admin.user.dialog.updateNotImplemented'))
      } else {
        // 创建用户 - 简化为控制台输出
        await authClient.admin.createUser({
          name: values.name,
          email: values.email,
          password: "123456",
          role: values.role,
          data: {
            username: values.username,
            displayUsername: values.displayUsername,
            banned: values.banned,
            banReason: values.banReason,
            banExpires: values.banExpires ? new Date(values.banExpires) : undefined,
          },
        });
      }
      // 刷新用户列表
      // window.location.reload()
      form.reset()
      onOpenChange(false)
      useQueryClient().refetchQueries({ queryKey: ['admin-users'] })
    } catch (error) {
      console.error('保存用户失败', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(state) => { form.reset(); onOpenChange(state) }}>
      <DialogContent>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? t('admin.user.dialog.edit') : t('admin.user.dialog.add')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('admin.user.dialog.update') : t('admin.user.dialog.create')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='admin-user-form' onSubmit={form.handleSubmit(onSubmit as any)} className='space-y-4 p-0.5'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.user.table.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.user.table.name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.user.table.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin.user.table.username')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='displayUsername'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.user.table.displayUsername')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin.user.table.displayUsername')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.user.table.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.user.table.email')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>{t('admin.user.table.role')}</FormLabel>
                    <FormMessage />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableRoles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="role"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, role.id])
                                      : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.id
                                        )
                                      )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='banned'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-0.5'>
                    <FormLabel>{t('admin.user.table.status')}</FormLabel>
                    <FormDescription>
                      {field.value ? t('admin.user.table.status.banned') : t('admin.user.table.status.normal')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('banned') && (
              <>
                <FormField
                  control={form.control}
                  name='banReason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.user.dialog.ban.reason')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('admin.user.dialog.ban.reason')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='banExpires'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.user.dialog.ban.expires')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='admin-user-form'>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}