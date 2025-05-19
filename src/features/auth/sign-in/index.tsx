import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>登录</CardTitle>
          <CardDescription>
            请在下方输入您的邮箱和密码<br />
            登录您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            点击登录，即表示您同意我们的{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              服务条款
            </a>
            {' '}和{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              隐私政策
            </a>
            。
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
