import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiChatService } from './ai-chat.service'

const db = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
}))
vi.mock('~/shared/lib/db', () => ({ getDb: async () => ({ aIConversation: db }) }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('renameConversation', () => {
  it('persists the trimmed title for the owning user only', async () => {
    db.findFirst.mockResolvedValue({ id: 'conv-1' })
    db.update.mockResolvedValue({ id: 'conv-1', title: '新标题' })

    await AiChatService.renameConversation('conv-1', 'user-1', '新标题')

    expect(db.findFirst).toHaveBeenCalledWith({
      where: { id: 'conv-1', userId: 'user-1' },
      select: { id: true },
    })
    expect(db.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { title: '新标题' },
    })
  })

  it('rejects renaming a conversation owned by another user', async () => {
    db.findFirst.mockResolvedValue(null)

    await expect(AiChatService.renameConversation('conv-1', 'user-2', '新标题')).rejects.toThrow(
      'Conversation not found'
    )
    expect(db.update).not.toHaveBeenCalled()
  })
})
