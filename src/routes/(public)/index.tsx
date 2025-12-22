import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Globe, Timer } from 'lucide-react'

export const Route = createFileRoute('/(public)/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className='relative overflow-hidden'>
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

      <div className='relative container py-12 md:py-16'>
        {/* Hero Section */}
        <section className='py-14 md:py-20'>
          <div className='mx-auto flex max-w-4xl flex-col items-center text-center'>
            <div className='bg-background/40 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur'>
              <span className='h-1.5 w-1.5 rounded-full bg-cyan-400' />
              TanStack Start + Better Auth + Prisma
            </div>

            <h1 className='mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl'>
              <span className='from-foreground to-foreground/70 bg-gradient-to-b bg-clip-text text-transparent'>
                简洁、科技、可扩展
              </span>
            </h1>

            <p className='text-muted-foreground mt-4 max-w-[46rem] text-base text-pretty md:text-lg'>
              用更少的样板与噪音，做更稳定的后台：类型安全路由、可组合 UI、可审计的权限与数据流。
            </p>

            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                to='/sign-up'
                className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium shadow-sm transition-colors'
              >
                立即开始
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
              <Link
                to='/sign-in'
                className='border-input bg-background/60 hover:bg-accent hover:text-accent-foreground inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium shadow-sm backdrop-blur transition-colors'
              >
                登录控制台
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className='py-10 md:py-14'>
          <div className='bg-background/40 mx-auto max-w-4xl rounded-2xl border p-6 backdrop-blur md:p-8'>
            <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
              <div>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <Activity className='text-primary h-4 w-4' />
                  System Status
                </div>
                <div className='text-muted-foreground mt-1 text-sm'>
                  轻量指标面板（静态展示），用来传达“系统稳定、可观测”。
                </div>
              </div>

              <div className='grid w-full gap-3 md:max-w-[520px] md:grid-cols-3'>
                <div className='bg-background/60 rounded-xl border p-4 backdrop-blur'>
                  <div className='flex items-center justify-between'>
                    <div className='text-muted-foreground text-xs'>Latency</div>
                    <Timer className='text-muted-foreground h-4 w-4' />
                  </div>
                  <div className='mt-2 text-2xl font-semibold tracking-tight'>42ms</div>
                  <div className='text-muted-foreground mt-1 text-xs'>p95 · edge</div>
                </div>

                <div className='bg-background/60 rounded-xl border p-4 backdrop-blur'>
                  <div className='flex items-center justify-between'>
                    <div className='text-muted-foreground text-xs'>Uptime</div>
                    <span className='h-2 w-2 rounded-full bg-emerald-400' />
                  </div>
                  <div className='mt-2 text-2xl font-semibold tracking-tight'>99.99%</div>
                  <div className='text-muted-foreground mt-1 text-xs'>30 days</div>
                </div>

                <div className='bg-background/60 rounded-xl border p-4 backdrop-blur'>
                  <div className='flex items-center justify-between'>
                    <div className='text-muted-foreground text-xs'>Regions</div>
                    <Globe className='text-muted-foreground h-4 w-4' />
                  </div>
                  <div className='mt-2 text-2xl font-semibold tracking-tight'>3</div>
                  <div className='text-muted-foreground mt-1 text-xs'>Global</div>
                </div>
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-muted-foreground text-xs'>Built on TanStack Start · Better Auth · Prisma</div>
              <div className='flex gap-3'>
                <Link
                  to='/sign-up'
                  className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium shadow-sm transition-colors'
                >
                  创建账号
                </Link>
                <Link
                  to='/sign-in'
                  className='border-input bg-background/60 hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-5 text-sm font-medium shadow-sm backdrop-blur transition-colors'
                >
                  进入控制台
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
