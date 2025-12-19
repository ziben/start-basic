import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            欢迎来到 Start Basic
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            一个现代化的全栈应用模板，基于 TanStack Start 构建
          </p>
          <div className="space-x-4">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              开始使用
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">快速开发</h3>
            <p className="text-muted-foreground">
              基于现代化技术栈，快速构建应用
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">安全可靠</h3>
            <p className="text-muted-foreground">
              内置认证授权，保护数据安全
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">灵活扩展</h3>
            <p className="text-muted-foreground">
              模块化设计，轻松扩展功能
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
