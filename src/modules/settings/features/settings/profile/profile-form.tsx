import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '@/modules/auth/shared/lib/auth-client'
import { useAuth } from '@/shared/context/auth-context'
import { authQueryKeys, userQueryKeys } from '@/shared/lib/query-keys'
import { CheckCircle2, Loader2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const profileFormSchema = z.object({
  name: z.string().trim().min(1, '请输入显示名称').max(80, '显示名称不能超过 80 个字符'),
  image: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true
      try {
        return ['https:', 'http:'].includes(new URL(value).protocol)
      } catch {
        return false
      }
    }, '请输入以 https:// 或 http:// 开头的头像地址'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm(): React.ReactElement {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user?.name ?? '', image: user?.image ?? '' },
  })
  const { isDirty, isSubmitting } = form.formState
  const name = form.watch('name')
  const image = form.watch('image')

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  async function onSubmit(values: ProfileFormValues) {
    setSaveError(null)
    try {
      const result = await authClient.updateUser({ name: values.name, image: values.image || null })
      if (result.error) {
        setSaveError(result.error.message || '保存失败，请稍后重试。')
        return
      }
      form.reset(values)
      toast.success('个人资料已保存')
    } catch {
      setSaveError('暂时无法保存，请检查网络连接后重试。')
      return
    }
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session }),
      ])
      await router.invalidate()
    } catch {
      toast.warning('资料已保存，但页面信息未能刷新，请刷新页面查看。')
    }
  }

  if (!user)
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        无法读取账号资料，请重新登录后重试。
      </p>
    )

  return (
    <div className='space-y-6'>
      <section aria-label='当前账号' className='flex min-w-0 items-center gap-4 rounded-xl border bg-muted/30 p-5'>
        <Avatar className='size-16 shrink-0 rounded-xl'>
          <AvatarImage src={image || undefined} alt={name || user.name} />
          <AvatarFallback className='rounded-xl text-xl'>
            {name.trim().slice(0, 2).toUpperCase() || <UserRound aria-hidden='true' />}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0 space-y-1'>
          <p className='truncate font-semibold'>{name.trim() || '尚未设置名称'}</p>
          <p className='text-sm break-all text-muted-foreground'>{user.email}</p>
          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
            {user.emailVerified ? (
              <>
                <CheckCircle2 className='size-3.5' aria-hidden='true' />
                邮箱已验证
              </>
            ) : (
              '邮箱尚未验证'
            )}
          </p>
        </div>
      </section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <fieldset disabled={isSubmitting} className='space-y-6 disabled:opacity-70'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>显示名称</FormLabel>
                  <FormControl>
                    <Input autoComplete='name' maxLength={80} placeholder='例如：张明…' {...field} />
                  </FormControl>
                  <FormDescription>用于侧边栏、个人菜单等位置，不会修改登录账号。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>头像地址</FormLabel>
                  <FormControl>
                    <Input
                      type='url'
                      autoComplete='off'
                      spellCheck={false}
                      placeholder='https://example.com/avatar.png…'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>填写可公开访问的图片地址；清空后使用名称缩写作为默认头像。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='space-y-2'>
              <label htmlFor='profile-email' className='text-sm font-medium'>
                登录邮箱
              </label>
              <Input
                id='profile-email'
                name='email'
                type='email'
                autoComplete='email'
                value={user.email}
                readOnly
                className='bg-muted/40 text-muted-foreground'
              />
              <p className='text-sm text-muted-foreground'>邮箱用于登录和账号识别，无法在个人资料中直接修改。</p>
            </div>
          </fieldset>
          {saveError && (
            <p
              role='alert'
              className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
            >
              {saveError}
            </p>
          )}
          <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-5'>
            <p role='status' className='text-sm text-muted-foreground'>
              {isSubmitting ? '正在保存…' : isDirty ? '有尚未保存的修改' : '资料已与账号同步'}
            </p>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={!isDirty || isSubmitting}
                onClick={() => {
                  form.reset()
                  setSaveError(null)
                }}
              >
                撤销修改
              </Button>
              <Button type='submit' disabled={!isDirty || isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='size-4 animate-spin motion-reduce:animate-none' aria-hidden='true' />
                )}
                {isSubmitting ? '正在保存…' : '保存资料'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
