import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Rocket, Sparkles, Smartphone, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/shared/context/auth-context'

export function MobileHomePage() {
    const { user } = useAuth()

    return (
        <div className="flex flex-col gap-6 p-4 pt-8">
            {/* Hero Section */}
            <section className="flex flex-col items-center text-center gap-4 py-6">
                <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
                    <Rocket className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Antigravity Mobile</h1>
                    <p className="text-muted-foreground mt-2">极致体验的移动端 H5 模版</p>
                </div>
                {!user && (
                    <Button asChild size="lg" className="mt-4 rounded-full px-8">
                        <Link to="/m/login">立即开启</Link>
                    </Button>
                )}
            </section>

            {/* Stats/Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
                <FeatureCard
                    icon={Sparkles}
                    title="现代美学"
                    description="毛玻璃与渐变色"
                    color="text-amber-500"
                    bg="bg-amber-50"
                />
                <FeatureCard
                    icon={Smartphone}
                    title="丝滑交互"
                    description="针对手势优化"
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
            </div>

            {/* Main Feature List */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        微信生态集成
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                        原生对接微信登录与支付 API v3
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            Better-Auth 深度集成
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            JSAPI / Native 支付支持
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {user && (
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">欢迎回来, {user.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link to="/m/profile">进入个人中心</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description, color, bg }: any) {
    return (
        <div className={cn("flex flex-col gap-2 p-4 rounded-2xl border bg-card", bg)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg.replace('50', '100'))}>
                <Icon className={cn("h-6 w-6", color)} />
            </div>
            <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-tight">{description}</p>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
