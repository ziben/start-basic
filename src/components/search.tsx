import { SearchIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useSearch } from '@/shared/context/search-provider'
import { Button } from './ui/button'

type SearchProps = {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = 'Search' }: SearchProps) {
  const { setOpen } = useSearch()
  return (
    <Button
      variant='outline'
      className={cn(
        'group relative h-8 w-full flex-1 justify-start rounded-md border border-border/80 bg-muted/40 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground dark:border-white/10 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 sm:w-40 sm:pe-12 md:flex-none lg:w-52 xl:w-64',
        className
      )}
      onClick={() => setOpen(true)}
    >
      <SearchIcon aria-hidden='true' className='absolute start-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70 group-hover:text-foreground' />
      <span className='ms-4.5'>{placeholder}</span>
      <kbd className='pointer-events-none absolute end-1.5 top-1.5 hidden h-5 items-center gap-1 rounded border border-border/80 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none group-hover:border-foreground/20 sm:flex dark:border-white/10 dark:bg-zinc-950/60'>
        <span className='text-[10px]'>⌘</span>K
      </kbd>
    </Button>
  )
}




