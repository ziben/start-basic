import { expect, it, vi } from 'vitest'
import { AiChatService } from './ai-chat.service'

const findMany = vi.hoisted(() => vi.fn().mockResolvedValue([]))
vi.mock('~/shared/lib/db', () => ({ getDb: async () => ({ aIConversation: { findMany } }) }))

it('bounds conversation history and keeps user isolation and stable ordering', async () => {
  await AiChatService.listConversations('user-1', 2)
  expect(findMany).toHaveBeenCalledWith({
    where: { userId: 'user-1' },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    skip: 30,
    take: 30,
    select: { id: true, title: true, updatedAt: true },
  })
})
