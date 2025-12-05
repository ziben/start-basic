import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '@/features/demo/chats'

export const Route = createFileRoute('/_authenticated/demo/chats/')({
  component: Chats,
})
