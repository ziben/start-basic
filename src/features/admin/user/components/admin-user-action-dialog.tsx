import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AdminUser } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'

const formSchema = z.object({
  username: z.string().min(1, { message: '用户名必填' }),
  email: z.string().min(1, { message: '邮箱必填' }).email({ message: '邮箱格式不正确' }),
  role: z.string().min(1, { message: '角色必填' }),
  status: z.string().min(1, { message: '状态必填' }),
})

type AdminUserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUserActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const isEdit = !!currentRow
  const form = useForm<AdminUserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          username: currentRow?.username || '',
          email: currentRow?.email || '',
          role: currentRow?.role || '',
          status: currentRow?.status || '',
        }
      : {
          username: '',
          email: '',
          role: '',
          status: '',
        },
  })

  const onSubmit = (values: AdminUserForm) => {
    // TODO: 调用API保存
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(state) => { form.reset(); onOpenChange(state) }}>
      <DialogContent>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? t('编辑用户') : t('添加用户')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('更新用户信息') : t('创建新用户')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='admin-user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-0.5'>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.user.table.role')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.user.table.role')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.user.table.status')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.user.table.status')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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