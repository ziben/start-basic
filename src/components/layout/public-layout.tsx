import { Outlet } from '@tanstack/react-router'
import { cn } from '@/shared/lib/utils'

type PublicLayoutProps = {
  children?: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className='flex min-h-svh flex-col'>
      {/* Header */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container flex h-14 items-center'>
          <div className='mr-4 flex'>
            <a href='/' className='mr-6 flex items-center space-x-2'>
              <span className='font-bold'>Start Basic</span>
            </a>
            <nav className='flex items-center space-x-6 text-sm font-medium'>
              <a href='/' className='text-foreground/60 transition-colors hover:text-foreground/80'>
                首页
              </a>
              <a href='/about' className='text-foreground/60 transition-colors hover:text-foreground/80'>
                关于
              </a>
            </nav>
          </div>
          <div className='flex flex-1 items-center justify-end space-x-2'>
            <a
              href='/sign-in'
              className='inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
            >
              登录
            </a>
            <a
              href='/sign-up'
              className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
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
          <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
            © 2024 Start Basic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}


