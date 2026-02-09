/**
 * Chat Types
 */

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt?: Date
}

export interface ChatSession {
    id: string
    messages: ChatMessage[]
    createdAt: Date
    updatedAt: Date
}
