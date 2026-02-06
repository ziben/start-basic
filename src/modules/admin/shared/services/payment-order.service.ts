/**
 * Payment Order Service - 订单业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'
import type { Prisma, PaymentStatus, PaymentMethod } from '~/generated/prisma/client'
import { serializePaymentOrder, serializePaymentOrders, isValidPaymentOrderSortField } from '../utils/admin-utils'

// ============ 类型定义 ============

export interface ListPaymentOrdersInput {
    page?: number
    pageSize?: number
    filter?: string
    status?: PaymentStatus
    paymentMethod?: PaymentMethod
    startDate?: string
    endDate?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface UpdatePaymentOrderStatusInput {
    status: PaymentStatus
    note?: string
}

export interface UpdatePaymentOrderInput {
    description?: string
    metadata?: Prisma.InputJsonValue
}

export interface PaymentOrderStats {
    totalOrders: number
    pendingOrders: number
    successOrders: number
    failedOrders: number
    refundedOrders: number
    closedOrders: number
    totalAmount: number
    successAmount: number
}

// ============ Service 实现 ============

export const PaymentOrderService = {
    /**
     * 获取订单列表（分页）
     */
    async getList(input: ListPaymentOrdersInput = {}) {
        try {
            const {
                page = 1,
                pageSize = 10,
                filter = '',
                status,
                paymentMethod,
                startDate,
                endDate,
                sortBy,
                sortDir,
            } = input

            const q = filter.trim()
            const whereClause: Prisma.PaymentOrderWhereInput = {
                ...(q
                    ? {
                        OR: [
                            { id: { contains: q } },
                            { outTradeNo: { contains: q } },
                            { transactionId: { contains: q } },
                            { description: { contains: q } },
                            { user: { email: { contains: q } } },
                            { user: { name: { contains: q } } },
                        ],
                    }
                    : {}),
                ...(status ? { status } : {}),
                ...(paymentMethod ? { paymentMethod } : {}),
                ...(startDate || endDate
                    ? {
                        createdAt: {
                            ...(startDate ? { gte: new Date(startDate) } : {}),
                            ...(endDate ? { lte: new Date(endDate) } : {}),
                        },
                    }
                    : {}),
            }

            const orderBy: Prisma.PaymentOrderOrderByWithRelationInput =
                sortBy && isValidPaymentOrderSortField(sortBy)
                    ? { [sortBy]: sortDir ?? 'desc' }
                    : { createdAt: 'desc' }

            const [total, orders] = await Promise.all([
                prisma.paymentOrder.count({ where: whereClause }),
                prisma.paymentOrder.findMany({
                    where: whereClause,
                    orderBy,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                }),
            ])

            const items = serializePaymentOrders(orders)
            const pageCount = Math.ceil(total / pageSize)

            return {
                items,
                total,
                page,
                pageSize,
                pageCount,
            }
        } catch (error) {
            console.error('获取订单列表失败:', error)
            throw new Error('获取订单列表失败')
        }
    },

    /**
     * 获取单个订单
     */
    async getById(id: string) {
        try {
            const order = await prisma.paymentOrder.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            username: true,
                        },
                    },
                },
            })

            if (!order) {
                throw new Error('订单不存在')
            }

            return serializePaymentOrder(order)
        } catch (error) {
            console.error('获取订单失败:', error)
            throw new Error('获取订单失败')
        }
    },

    /**
     * 更新订单状态
     */
    async updateStatus(id: string, input: UpdatePaymentOrderStatusInput) {
        try {
            const order = await prisma.paymentOrder.findUnique({
                where: { id },
            })

            if (!order) {
                throw new Error('订单不存在')
            }

            // 更新订单状态
            const updateData: Prisma.PaymentOrderUpdateInput = {
                status: input.status,
            }

            // 如果状态变为成功，记录支付时间
            if (input.status === 'SUCCESS' && !order.paidAt) {
                updateData.paidAt = new Date()
            }

            // 如果有备注，添加到metadata
            if (input.note) {
                const currentMetadata = (order.metadata as Record<string, any>) || {}
                updateData.metadata = {
                    ...currentMetadata,
                    statusNote: input.note,
                    lastStatusChange: new Date().toISOString(),
                }
            }

            const updatedOrder = await prisma.paymentOrder.update({
                where: { id },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            })

            return serializePaymentOrder(updatedOrder)
        } catch (error) {
            console.error('更新订单状态失败:', error)
            throw error instanceof Error ? error : new Error('更新订单状态失败')
        }
    },

    /**
     * 更新订单信息
     */
    async update(id: string, input: UpdatePaymentOrderInput) {
        try {
            const order = await prisma.paymentOrder.findUnique({
                where: { id },
            })

            if (!order) {
                throw new Error('订单不存在')
            }

            const updateData: Prisma.PaymentOrderUpdateInput = {}
            if (input.description !== undefined) updateData.description = input.description
            if (input.metadata !== undefined) updateData.metadata = input.metadata

            const updatedOrder = await prisma.paymentOrder.update({
                where: { id },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            })

            return serializePaymentOrder(updatedOrder)
        } catch (error) {
            console.error('更新订单失败:', error)
            throw error instanceof Error ? error : new Error('更新订单失败')
        }
    },

    /**
     * 获取订单统计
     */
    async getStats(): Promise<PaymentOrderStats> {
        try {
            const [
                totalOrders,
                pendingOrders,
                successOrders,
                failedOrders,
                refundedOrders,
                closedOrders,
                amountStats,
            ] = await Promise.all([
                prisma.paymentOrder.count(),
                prisma.paymentOrder.count({ where: { status: 'PENDING' } }),
                prisma.paymentOrder.count({ where: { status: 'SUCCESS' } }),
                prisma.paymentOrder.count({ where: { status: 'FAILED' } }),
                prisma.paymentOrder.count({ where: { status: 'REFUNDED' } }),
                prisma.paymentOrder.count({ where: { status: 'CLOSED' } }),
                prisma.paymentOrder.aggregate({
                    _sum: {
                        amount: true,
                    },
                }),
            ])

            const successAmountStats = await prisma.paymentOrder.aggregate({
                where: { status: 'SUCCESS' },
                _sum: {
                    amount: true,
                },
            })

            return {
                totalOrders,
                pendingOrders,
                successOrders,
                failedOrders,
                refundedOrders,
                closedOrders,
                totalAmount: amountStats._sum.amount || 0,
                successAmount: successAmountStats._sum.amount || 0,
            }
        } catch (error) {
            console.error('获取订单统计失败:', error)
            throw new Error('获取订单统计失败')
        }
    },
}

export default PaymentOrderService
