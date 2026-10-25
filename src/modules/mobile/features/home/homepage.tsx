import { Link } from '@tanstack/react-router'
import { BookOpen, ClipboardList, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/shared/context/auth-context'

export function MobileHomePage() {
    const { user } = useAuth()

    return (
        <div className="flex flex-col gap-4 p-4 pt-8">
            <section className="flex flex-col items-start gap-1 px-2 text-left">
                <h1 className="text-2xl font-bold tracking-tight">
                    {user ? `欢迎回来，${user.name}` : '欢迎使用'}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {user ? '选择下方入口继续使用' : '登录后即可使用题库与健康档案服务'}
                </p>
                {!user && (
                    <Button asChild size="lg" className="mt-3 rounded-full px-8">
                        <Link to="/m/login">前往登录</Link>
                    </Button>
                )}
            </section>

            {/* 业务入口 */}
            <div className="grid grid-cols-2 gap-3">
                <Link to="/question-bank" className="group text-left">
                    <Card className="h-full border shadow-sm transition-colors group-hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-4">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold">题库工作台</span>
                            <span className="text-xs text-muted-foreground">维护题库与题目</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/question-bank" search={{ view: 'papers' }} className="group text-left">
                    <Card className="h-full border shadow-sm transition-colors group-hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-4">
                            <FileText className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold">我的试卷</span>
                            <span className="text-xs text-muted-foreground">组卷与试卷管理</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/health/persons" className="group text-left">
                    <Card className="h-full border shadow-sm transition-colors group-hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-4">
                            <Users className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold">健康档案</span>
                            <span className="text-xs text-muted-foreground">管理家庭成员档案</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/health/reports" className="group text-left">
                    <Card className="h-full border shadow-sm transition-colors group-hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-4">
                            <ClipboardList className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold">体检报告</span>
                            <span className="text-xs text-muted-foreground">查看与录入报告</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
