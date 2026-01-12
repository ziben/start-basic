import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/chats/')({
  component: Chats,
})



