import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors duration-150 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 shadow-xs',
        secondary:
          'border-border/60 bg-secondary/80 text-secondary-foreground [a&]:hover:bg-secondary dark:border-white/5',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20 [a&]:hover:bg-destructive/25',
        outline:
          'border-border/80 bg-background/50 text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground dark:border-white/10',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400',
        info:
          'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp data-slot='badge' data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
