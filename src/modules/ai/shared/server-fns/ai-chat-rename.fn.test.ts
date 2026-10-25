import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RenameConversationSchema } from './ai-chat.fn'

vi.mock('~/modules/auth/shared/lib/require-auth', () => ({ requireUser: vi.fn() }))
vi.mock('../services/ai-chat.service', () => ({ AiChatService: {} }))

beforeEach(() => vi.clearAllMocks())

describe('RenameConversationSchema', () => {
  it('rejects blank or overlong titles and empty conversation ids', () => {
    expect(RenameConversationSchema.safeParse({ conversationId: 'conv-1', title: '   ' }).success).toBe(false)
    expect(RenameConversationSchema.safeParse({ conversationId: 'conv-1', title: '长'.repeat(101) }).success).toBe(
      false
    )
    expect(RenameConversationSchema.safeParse({ conversationId: '', title: '标题' }).success).toBe(false)
  })

  it('trims and accepts valid rename input', () => {
    expect(RenameConversationSchema.parse({ conversationId: 'conv-1', title: '  新标题  ' })).toEqual({
      conversationId: 'conv-1',
      title: '新标题',
    })
  })
})
