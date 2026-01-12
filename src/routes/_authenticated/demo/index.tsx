import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/demo/')({
  component: DemoDashboard,
})

function DemoDashboard() {
  return (
    <div className='container py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight'>管理后台</h1>
        <p className='text-muted-foreground'>欢迎来到管理控制台</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg border bg-card p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-xs text-muted-foreground'>总用户数</p>
        </div>
        <div className='rounded-lg border bg-card p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-xs text-muted-foreground'>活跃会话</p>
        </div>
        <div className='rounded-lg border bg-card p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-xs text-muted-foreground'>组织数量</p>
        </div>
        <div className='rounded-lg border bg-card p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-xs text-muted-foreground'>导航项</p>
        </div>
      </div>
    </div>
  )
}


