import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className='container py-12'>
      <div className='mx-auto max-w-3xl'>
        <h1 className='mb-6 text-3xl font-bold tracking-tight'>关于我们</h1>
        <div className='prose prose-neutral dark:prose-invert'>
          <p className='text-muted-foreground text-lg'>
            Start Basic 是一个现代化的全栈应用模板，旨在帮助开发者快速构建高质量的 Web 应用。
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-semibold'>技术栈</h2>
          <ul className='text-muted-foreground space-y-2'>
            <li>• TanStack Start - 全栈 React 框架</li>
            <li>• TanStack Router - 类型安全的路由</li>
            <li>• TanStack Query - 服务端状态管理</li>
            <li>• Prisma - 数据库 ORM</li>
            <li>• Better Auth - 认证授权</li>
            <li>• Tailwind CSS - 样式框架</li>
            <li>• shadcn/ui - UI 组件库</li>
          </ul>

          <h2 className='mt-8 mb-4 text-2xl font-semibold'>特性</h2>
          <ul className='text-muted-foreground space-y-2'>
            <li>• 完整的用户认证系统</li>
            <li>• 基于角色的权限控制</li>
            <li>• 国际化支持</li>
            <li>• 深色模式</li>
            <li>• 响应式设计</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
