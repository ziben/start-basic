import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/_app/demo/chats/')({
  component: Chats,
})



