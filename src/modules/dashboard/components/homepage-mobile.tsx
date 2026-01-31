import { Link } from '@tanstack/react-router'
import { ArrowRight, Smartphone, LayoutDashboard, Settings, User } from 'lucide-react'

export function HomepageMobile() {
    return (
        <div className='relative flex flex-col min-h-screen bg-background pb-20'>
            {/* Mobile Top Bar */}
            <header className='sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg'>
                <div className='container flex h-14 items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className='h-8 w-8 rounded-lg bg-primary flex items-center justify-center'>
                            <Smartphone className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <span className='font-bold'>Zi Start</span>
                    </div>
                    <Link to='/sign-in' className='text-sm font-medium text-primary'>
                        登录
                    </Link>
                </div>
            </header>

            <main className='flex-1 container py-8'>
                {/* Hero */}
                <div className='relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-xl'>
                    <div className='relative z-10'>
                        <h1 className='text-3xl font-bold tracking-tight'>
                            移动端专属体验
                        </h1>
                        <p className='mt-2 text-indigo-100'>
                            简约而不简单。随时随地，触手可及的业务视窗。
                        </p>
                        <div className='mt-6'>
                            <Link
                                to='/sign-up'
                                className='inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-indigo-600 shadow-sm transition-transform active:scale-95'
                            >
                                立即加入
                                <ArrowRight className='ml-2 h-4 w-4' />
                            </Link>
                        </div>
                    </div>
                    <div className='absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 bg-white/10 rounded-full blur-3xl' />
                </div>

                {/* Quick Stats */}
                <div className='mt-8 grid grid-cols-2 gap-4'>
                    <div className='rounded-xl border bg-card p-4 shadow-sm'>
                        <div className='text-xs text-muted-foreground font-medium uppercase'>Latency</div>
                        <div className='mt-1 text-2xl font-bold'>42ms</div>
                    </div>
                    <div className='rounded-xl border bg-card p-4 shadow-sm'>
                        <div className='text-xs text-muted-foreground font-medium uppercase'>Uptime</div>
                        <div className='mt-1 text-2xl font-bold text-emerald-500'>99.9%</div>
                    </div>
                </div>

                {/* Feature List */}
                <div className='mt-8 space-y-4'>
                    <h2 className='text-lg font-semibold'>核心功能</h2>
                    {[
                        { title: '多端同步', desc: '数据在所有设备间即时同步' },
                        { title: '轻量极速', desc: '针对移动网络优化的加载性能' },
                        { title: '离线访问', desc: '基础功能在断网时依然可用' }
                    ].map((item, i) => (
                        <div key={i} className='flex items-start gap-4 p-4 rounded-xl border bg-accent/30'>
                            <div className='h-2 w-2 mt-2 rounded-full bg-primary shrink-0' />
                            <div>
                                <div className='font-medium'>{item.title}</div>
                                <div className='text-sm text-muted-foreground'>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className='fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur-sm shadow-lg'>
                <div className='container grid h-full grid-cols-3 items-center gap-1 px-2'>
                    <Link to='/' className='flex flex-col items-center gap-1 text-primary'>
                        <LayoutDashboard className='h-5 w-5' />
                        <span className='text-[10px] font-medium'>首页</span>
                    </Link>
                    <Link to='/admin' className='flex flex-col items-center gap-1 text-muted-foreground'>
                        <Settings className='h-5 w-5' />
                        <span className='text-[10px] font-medium'>管理</span>
                    </Link>
                    <Link to='/sign-in' className='flex flex-col items-center gap-1 text-muted-foreground'>
                        <User className='h-5 w-5' />
                        <span className='text-[10px] font-medium'>我的</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
