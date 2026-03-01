import { getDb } from '~/shared/lib/db'
import type { Prisma } from '~/generated/prisma/client'

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
    static async saveMessage(
        conversationId: string,
        role: string,
        content: string,
        options?: {
            inputTokens?: number
            outputTokens?: number
            totalTokens?: number
            model?: string
        },
    ) {
        const db = await getDb();
        return db.$transaction(async (tx) => {
            const msg = await tx.aIMessage.create({
                data: {
                    conversationId,
                    role,
                    content,
                    inputTokens: options?.inputTokens,
                    outputTokens: options?.outputTokens,
                    totalTokens: options?.totalTokens,
                    model: options?.model,
                },
            });
            await tx.aIConversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });
            return msg;
        });
    }

    // ============ Admin 方法 ============

    static async adminListConversations(input: {
        page?: number
        pageSize?: number
        filter?: string
        sortBy?: string
        sortDir?: 'asc' | 'desc'
    } = {}) {
        const { page = 1, pageSize = 20, filter = '', sortBy, sortDir } = input

        const q = filter.trim()
        const whereClause: Prisma.AIConversationWhereInput = q
            ? {
                  OR: [
                      { title: { contains: q } },
                      { user: { name: { contains: q } } },
                      { user: { email: { contains: q } } },
                  ],
              }
            : {}

        const orderBy: Prisma.AIConversationOrderByWithRelationInput =
            sortBy === 'title' || sortBy === 'createdAt'
                ? { [sortBy]: sortDir ?? 'desc' }
                : { updatedAt: 'desc' }

        const db = await getDb()
        const [total, conversations] = await Promise.all([
            db.aIConversation.count({ where: whereClause }),
            db.aIConversation.findMany({
                where: whereClause,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    _count: { select: { messages: true } },
                },
            }),
        ])

        return {
            items: conversations.map((conv) => ({
                id: conv.id,
                title: conv.title,
                userId: conv.userId,
                userName: conv.user.name,
                userEmail: conv.user.email,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                messageCount: conv._count.messages,
            })),
            total,
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
        }
    }

    static async adminGetConversation(conversationId: string) {
        const db = await getDb()

        const conversation = await db.aIConversation.findUnique({
            where: { id: conversationId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        role: true,
                        content: true,
                        inputTokens: true,
                        outputTokens: true,
                        totalTokens: true,
                        model: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!conversation) return null

        const totalTokens = conversation.messages.reduce(
            (sum, msg) => sum + (msg.totalTokens ?? 0),
            0,
        )

        return {
            id: conversation.id,
            title: conversation.title,
            userId: conversation.userId,
            userName: conversation.user.name,
            userEmail: conversation.user.email,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: conversation.messages,
            totalTokens: totalTokens > 0 ? totalTokens : null,
        }
    }

    static async adminDeleteConversation(conversationId: string) {
        const db = await getDb()
        await db.aIConversation.delete({ where: { id: conversationId } })
        return { success: true }
    }
}
