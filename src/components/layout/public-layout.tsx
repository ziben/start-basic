import { Outlet } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

type PublicLayoutProps = {
  children?: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className='flex min-h-svh flex-col'>
      {/* Header */}
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
        <div className='container flex h-14 items-center'>
          <div className='mr-4 flex'>
            <a href='/' className='mr-6 flex items-center space-x-2'>
              <span className='font-bold'>Start Basic</span>
            </a>
            <nav className='flex items-center space-x-6 text-sm font-medium'>
              <a href='/' className='hover:text-foreground/80 text-foreground/60 transition-colors'>
                首页
              </a>
              <a href='/about' className='hover:text-foreground/80 text-foreground/60 transition-colors'>
                关于
              </a>
            </nav>
          </div>
          <div className='flex flex-1 items-center justify-end space-x-2'>
            <a
              href='/sign-in'
              className='focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
            >
              登录
            </a>
            <a
              href='/sign-up'
              className='focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
            >
              注册
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>{children ?? <Outlet />}</main>

      {/* Footer */}
      <footer className='border-t py-6 md:py-0'>
        <div className='container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row'>
          <p className='text-muted-foreground text-center text-sm leading-loose md:text-left'>
            © 2024 Start Basic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
