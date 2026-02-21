import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WeChatLoginButton } from '@/modules/auth/features/wechat'
import { Smartphone, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { usePublicConfigs } from '~/modules/admin/features/system-config/hooks/use-system-config-query'
import { useMemo } from 'react'

export function MobileLoginPage() {
    const navigate = useNavigate()
    const { data: configs } = usePublicConfigs()

    const systemName = useMemo(() => {
        return configs?.find((c) => c.key === 'system_name')?.value || 'Antigravity'
    }, [configs])

    const loginTitle = useMemo(() => {
        return configs?.find((c) => c.key === 'login_title')?.value || '欢迎使用'
    }, [configs])

    return (
        <div className="flex min-h-screen flex-col bg-background p-6">
            <header className="flex h-12 items-center">
                <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/m' })}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center gap-8 pb-20">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
                        <Smartphone className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">{loginTitle}</h1>
                    <p className="text-muted-foreground px-8">
                        请选择登录方式进入 {systemName}
                    </p>
                </div>

                <div className="w-full max-w-sm space-y-4">
                    <WeChatLoginButton
                        className="w-full h-12 rounded-full text-lg font-medium bg-[#07C160] hover:bg-[#06AD56] text-white border-none"
                        callbackUrl="/m"
                    >
                        微信一键登录
                    </WeChatLoginButton>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                其他方式
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-12 rounded-full font-medium" asChild>
                        <Link to="/sign-in">密码通道 (账号登录)</Link>
                    </Button>
                </div>
            </main>

            <footer className="py-6 text-center">
                <p className="text-xs text-muted-foreground">
                    登录即代表同意 <span className="text-primary hover:underline">用户协议</span> 和 <span className="text-primary hover:underline">隐私策略</span>
                </p>
            </footer>
        </div>
    )
}
