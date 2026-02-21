/**
 * AI Chat Page Route
 */

import { createFileRoute } from '@tanstack/react-router'
import { ChatbotPage } from '~/modules/ai/features/chatbot/chatbot-page'

export const Route = createFileRoute('/_authenticated/ai/chat')({
    component: ChatbotPage,
})
