import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Route } from '~/routes/(auth)/sign-in'
import { authClient } from '@/modules/auth/shared/lib/auth-client'
import { resolveRedirectTarget } from '@/modules/auth/shared/lib/safe-redirect'
import { cn } from '@/shared/lib/utils'
import { userQueryKeys } from '~/shared/lib/query-keys'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? '请输入您的邮箱' : undefined),
  }),
  password: z.string().min(1, 'Please enter your password').min(7, 'Password must be at least 7 characters long'),
  rememberMe: z.boolean().optional(),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isDev = import.meta.env.DEV
  const navigate = useNavigate()
  const { queryClient } = Route.useRouteContext()
  const safeRedirect = resolveRedirectTarget(redirectTo, '/dashboard')

  type FormType = z.infer<typeof formSchema>
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: isDev ? 'admin@example.com' : '',
      password: isDev ? 'admin123' : '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL: safeRedirect,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: userQueryKeys.current })
          if (safeRedirect === '/dashboard') {
            navigate({ to: '/dashboard' })
            return
          }

          window.location.assign(safeRedirect)
        },
        onError: (ctx) => {
          setIsLoading(false)
          if (ctx.error.status === 403) {
            toast.error('Please verify your email address')
          }
          toast.error(ctx.error.message)
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3', className)} {...props}>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute -top-0.5 right-0 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                忘记密码？
              </Link>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='rememberMe'
          render={({ field }) => (
            <FormItem className='flex items-center space-x-2'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className='text-sm'>记住我</FormLabel>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          登录
        </Button>
      </form>
    </Form>
  )
}
