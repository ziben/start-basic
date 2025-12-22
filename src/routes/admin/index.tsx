import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className='container py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight'>管理后台</h1>
        <p className='text-muted-foreground'>欢迎来到管理控制台</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='bg-card rounded-lg border p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-muted-foreground text-xs'>总用户数</p>
        </div>
        <div className='bg-card rounded-lg border p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-muted-foreground text-xs'>活跃会话</p>
        </div>
        <div className='bg-card rounded-lg border p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-muted-foreground text-xs'>组织数量</p>
        </div>
        <div className='bg-card rounded-lg border p-6'>
          <div className='text-2xl font-bold'>0</div>
          <p className='text-muted-foreground text-xs'>导航项</p>
        </div>
      </div>
    </div>
  )
}
