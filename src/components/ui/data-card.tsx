import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}

export function DataCard({ title, value, description, icon }: DataCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </CardContent>
    </Card>
  )
}
