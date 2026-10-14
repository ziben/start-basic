import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-14 border-b border-border/60 bg-background/80 backdrop-blur-md transition-shadow duration-200',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow-xs' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div className='relative flex h-full items-center gap-3 px-4 sm:gap-4'>
        <SidebarTrigger variant='ghost' size='icon' className='size-8 rounded-md text-muted-foreground hover:text-foreground max-md:scale-110' />
        <Separator orientation='vertical' className='h-4 bg-border/60' />
        {children}
      </div>
    </header>
  )
}



