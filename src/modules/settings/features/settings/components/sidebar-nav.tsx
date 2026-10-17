import { type JSX } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: {
    href: '/settings' | '/settings/account' | '/settings/appearance' | '/settings/notifications' | '/settings/display'
    title: string
    icon: JSX.Element
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps): React.ReactElement {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select
          value={pathname}
          onValueChange={(value) => {
            const item = items.find((item) => item.href === value)
            if (item) void navigate({ to: item.href })
          }}
        >
          <SelectTrigger aria-label='设置分类' className='h-12 w-full sm:w-48'>
            <SelectValue placeholder='选择设置分类'>
              {items.find((item) => item.href === pathname)?.title ?? '选择设置分类'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className='flex gap-x-4 px-2 py-1'>
                  <span className='scale-125'>{item.icon}</span>
                  <span className='text-md'>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea type='always' className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'>
        <nav className={cn('flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0', className)} {...props}>
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                pathname === item.href ? 'bg-muted hover:bg-accent' : 'hover:bg-accent hover:underline',
                'justify-start'
              )}
            >
              <span className='me-2'>{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
