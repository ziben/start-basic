/**
 * AI Chat Page Route
 */

import { createFileRoute } from '@tanstack/react-router'
import { ChatbotPage } from '~/modules/ai'

export const Route = createFileRoute('/_authenticated/ai/chat')({
    component: ChatbotPage,
})
