import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/settings')({
  component: () => (
    <div className="flex h-screen items-center justify-center">
      <h2 className="text-xl font-medium text-muted-foreground">设置 (开发中...)</h2>
    </div>
  ),
})
