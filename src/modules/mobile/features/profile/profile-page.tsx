import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type LucideIcon, Settings, CreditCard, Shield, ChevronRight, LogOut, Heart } from 'lucide-react'
import { useAuth } from '@/shared/context/auth-context'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/modules/auth/shared/lib/auth-client'
import { toast } from 'sonner'
import { authQueryKeys, userQueryKeys } from '@/shared/lib/query-keys'

export function MobileProfilePage(): React.ReactElement {
    const { user } = useAuth()
    const navigate = useNavigate()
    const router = useRouter()
    const queryClient = useQueryClient()

    const handleLogout = async (): Promise<void> => {
        try {
            await authClient.signOut()
            queryClient.setQueryData(userQueryKeys.current, null)
            queryClient.setQueryData(authQueryKeys.session, null)
            queryClient.invalidateQueries({ queryKey: userQueryKeys.current })
            queryClient.invalidateQueries({ queryKey: authQueryKeys.session })
            toast.success('已退出登录')
            // 重置路由状态，清除 context 中的用户信息
            await router.invalidate()
            navigate({ to: '/m' })
        } catch {
            toast.error('退出登录失败')
        }
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <Card className="w-full max-w-sm text-center">
                    <CardHeader>
                        <CardTitle>尚未登录</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">请登录后查看您的个人信息</p>
                        <Button className="rounded-full" onClick={() => navigate({ to: '/m/login' })}>
                            前往登录
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
            {/* Header Info */}
            <section className="bg-white dark:bg-slate-900 px-6 pt-12 pb-8 rounded-b-[2rem] shadow-sm flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/10">
                    <AvatarImage src={user.image || ''} alt={user.name} />
                    <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">
                        {user.role}
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="h-5 w-5" />
                </Button>
            </section>

            {/* Stats/Quick Actions */}
            <div className="grid grid-cols-3 gap-3 px-4">
                <StatItem label="积分" value="1,240" />
                <StatItem label="订单" value="8" />
                <StatItem label="收藏" value="24" icon={Heart} />
            </div>

            {/* Menu List */}
            <section className="px-4 space-y-2">
                <Card className="border-none shadow-sm overflow-hidden">
                    <MenuItem icon={CreditCard} label="我的钱包" />
                    <MenuItem icon={Shield} label="账号安全" />
                </Card>

                <Card className="border-none shadow-sm overflow-hidden mt-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-between h-14 px-4 text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">退出登录</span>
                        </div>
                    </Button>
                </Card>
            </section>
        </div>
    )
}

function StatItem({ label, value, icon: Icon }: Readonly<{ label: string; value: string; icon?: LucideIcon }>): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm gap-1">
            {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
            <span className="text-lg font-bold">{value}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
        </div>
    )
}

function MenuItem({ icon: Icon, label }: Readonly<{ icon: LucideIcon; label: string }>): React.ReactElement {
    return (
        <Button variant="ghost" className="w-full justify-between h-14 px-4 border-b last:border-b-0 rounded-none">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
    )
}
