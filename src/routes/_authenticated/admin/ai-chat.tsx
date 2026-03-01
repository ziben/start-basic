import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { createFileRoute } from '@tanstack/react-router'
import { AdminAIChatPage } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/ai-chat')({
    validateSearch: tableSearchSchema,
    component: AdminAIChatPage,
})
