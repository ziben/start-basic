import { getDb } from '~/shared/lib/db'

export class AiChatService {
    /**
     * 获取用户的对话列表
     */
    static async listConversations(userId: string) {
        const db = await getDb();
        return db.aIConversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                updatedAt: true,
            }
        });
    }

    /**
     * 获取单个对话的所有消息
     */
    static async getMessages(conversationId: string, userId: string) {
        const db = await getDb();

        // 权限校验
        const conv = await db.aIConversation.findUnique({
            where: { id: conversationId, userId }
        });

        if (!conv) {
            throw new Error("Conversation not found");
        }

        return db.aIMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        });
    }

    /**
     * 创建新对话
     */
    static async createConversation(userId: string, title?: string) {
        const db = await getDb();
        return db.aIConversation.create({
            data: {
                userId,
                title: title || '新对话',
            }
        });
    }

    /**
     * 删除对话
     */
    static async deleteConversation(conversationId: string, userId: string) {
        const db = await getDb();
        return db.aIConversation.delete({
            where: { id: conversationId, userId } // 确保只能删除自己的
        });
    }

    /**
     * 存储新消息并更新对话的最后活跃时间
     */
    static async saveMessage(conversationId: string, role: string, content: string) {
        const db = await getDb();
        return db.$transaction(async (tx) => {
            const msg = await tx.aIMessage.create({
                data: {
                    conversationId,
                    role,
                    content
                }
            });
            await tx.aIConversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
            return msg;
        });
    }
}
