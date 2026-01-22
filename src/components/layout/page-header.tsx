import { cn } from "@/shared/lib/utils"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
  hide?: boolean
}

export function PageHeader({
  title,
  description,
  children,
  className,
  hide = true,
}: PageHeaderProps) {
  if (hide) return null

  return (
    <div className={cn("mb-6 flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
