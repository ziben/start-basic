import { Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Globe, Timer, Monitor } from 'lucide-react'

export function HomepagePC() {
    return (
        <div className='relative overflow-hidden min-h-screen'>
            <div
                className='pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.35]'
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(60% 55% at 50% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                    WebkitMaskImage: 'radial-gradient(60% 55% at 50% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                }}
            />
            <div
                className='pointer-events-none absolute top-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl'
                style={{
                    background:
                        'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.30), transparent 55%)',
                }}
            />

            <div className='relative container py-12 md:py-24'>
                {/* Hero Section */}
                <section className='py-14 md:py-20'>
                    <div className='mx-auto flex max-w-4xl flex-col items-center text-center'>
                        <div className='inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur'>
                            <Monitor className='h-3.5 w-3.5' />
                            <span>桌面端专用体验</span>
                            <span className='h-1.5 w-1.5 rounded-full bg-cyan-400' />
                            TanStack Start + Better Auth + Prisma
                        </div>

                        <h1 className='mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-7xl'>
                            <span className='bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent'>
                                高效、沉浸、全功能
                            </span>
                        </h1>

                        <p className='mt-6 max-w-[46rem] text-base text-pretty text-muted-foreground md:text-xl'>
                            专为大屏幕优化的管理后台。类型安全路由、可组合 UI、多维数据看板，助您掌控业务全貌。
                        </p>

                        <div className='mt-10 flex flex-col gap-4 sm:flex-row justify-center'>
                            <Link
                                to='/sign-up'
                                className='inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105'
                            >
                                立即开始
                                <ArrowRight className='ml-2 h-4 w-4' />
                            </Link>
                            <Link
                                to='/sign-in'
                                className='inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background/60 px-8 text-sm font-medium shadow-sm backdrop-blur transition-all hover:bg-accent hover:text-accent-foreground'
                            >
                                登录控制台
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className='py-10 md:py-14'>
                    <div className='mx-auto max-w-5xl rounded-3xl border bg-background/40 p-8 backdrop-blur md:p-12 shadow-2xl'>
                        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                            <div className='flex flex-col gap-2'>
                                <div className='flex items-center gap-2 text-sm font-medium text-primary'>
                                    <Activity className='h-5 w-5' />
                                    系统实时状态
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    全方位监控指标，确保持续可用与高性能响应。
                                </p>
                            </div>

                            <div className='rounded-2xl border bg-background/60 p-6 backdrop-blur transition-all hover:shadow-md'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Latency</div>
                                    <Timer className='h-4 w-4 text-cyan-500' />
                                </div>
                                <div className='mt-3 text-3xl font-bold tracking-tight'>42ms</div>
                                <div className='mt-1 text-xs text-muted-foreground'>p95 · edge locations</div>
                            </div>

                            <div className='rounded-2xl border bg-background/60 p-6 backdrop-blur transition-all hover:shadow-md'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Uptime</div>
                                    <span className='h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse' />
                                </div>
                                <div className='mt-3 text-3xl font-bold tracking-tight'>99.99%</div>
                                <div className='mt-1 text-xs text-muted-foreground'>last 30 days status</div>
                            </div>
                        </div>

                        <div className='mt-10 border-t pt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='text-sm text-muted-foreground'>
                                底层基于现代技术栈构建，确保极致的类型安全与开发体验。
                            </div>
                            <div className='flex gap-4'>
                                <Link
                                    to='/admin'
                                    className='inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background/60 px-6 text-sm font-medium shadow-sm backdrop-blur transition-colors hover:bg-accent'
                                >
                                    管理后台
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
