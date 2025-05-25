import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { authClient } from "@/lib/auth-client"
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { HTMLAttributes, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Route } from '~/routes/(auth)/sign-in'

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: '请输入您的邮箱' })
    .email({ message: '邮箱地址无效' }),
  password: z
    .string()
    .min(1, {
      message: '请输入您的密码',
    })
    .min(7, {
      message: '密码长度必须至少为7个字符',
    }),
  rememberMe: z.boolean().default(false),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'test@local.com',
      password: 'test1234',
      rememberMe: false,
    },
  } as any)

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // eslint-disable-next-line no-console
    console.log(data)
    const result = await authClient.signIn.email({
      /**
       * The user email
       */
      email: data.email,
      /**
       * The user password
       */
      password: data.password,
      /**
       * remember the user session after the browser is closed. 
       * @default true
       */
      rememberMe: data.rememberMe,
      callbackURL: '/'
    }, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        navigate({ to: '/' });
      },
      onError: (ctx) => {
        setIsLoading(false);
        // Handle the error
        if (ctx.error.status === 403) {
          toast.error("Please verify your email address")
        }
        //you can also show the original error message
        toast.error(ctx.error.message);
      },
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
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
                className='text-muted-foreground absolute -top-0.5 right-0 text-sm font-medium hover:opacity-75'
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
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className='text-sm'>记住我</FormLabel>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          登录
        </Button>
      </form>
    </Form>
  )
}
