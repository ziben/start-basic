import prisma from '@/shared/lib/db'
import type { PaymentMethod, PaymentStatus, Prisma } from '~/generated/prisma/client'
import {
  isValidPaymentOrderSortField,
  serializePaymentOrderForAdmin,
  serializePaymentOrdersForAdmin,
} from '../payment-order-admin.format'

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

const paymentOrderUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
    },
  },
} satisfies Prisma.PaymentOrderInclude

export const PaymentOrderAdminService = {
  async getList(input: ListPaymentOrdersInput = {}) {
    try {
      const { page = 1, pageSize = 10 } = input
      const where = buildPaymentOrderWhere(input)
      const orderBy = buildPaymentOrderOrderBy(input)
      const [total, orders] = await Promise.all([
        prisma.paymentOrder.count({ where }),
        prisma.paymentOrder.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: paymentOrderUserInclude,
        }),
      ])

      return {
        items: serializePaymentOrdersForAdmin(orders),
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
      throw new Error('获取订单列表失败')
    }
  },

  async getById(id: string) {
    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { id },
        include: paymentOrderUserInclude,
      })

      if (!order) {
        throw new Error('订单不存在')
      }

      return serializePaymentOrderForAdmin(order)
    } catch (error) {
      console.error('获取订单失败:', error)
      throw new Error('获取订单失败')
    }
  },

  async updateStatus(id: string, input: UpdatePaymentOrderStatusInput) {
    try {
      const order = await prisma.paymentOrder.findUnique({ where: { id } })

      if (!order) {
        throw new Error('订单不存在')
      }

      const updatedOrder = await prisma.paymentOrder.update({
        where: { id },
        data: buildStatusUpdateData(order, input),
        include: paymentOrderUserInclude,
      })

      return serializePaymentOrderForAdmin(updatedOrder)
    } catch (error) {
      console.error('更新订单状态失败:', error)
      throw error instanceof Error ? error : new Error('更新订单状态失败')
    }
  },

  async update(id: string, input: UpdatePaymentOrderInput) {
    try {
      const order = await prisma.paymentOrder.findUnique({ where: { id } })

      if (!order) {
        throw new Error('订单不存在')
      }

      const updatedOrder = await prisma.paymentOrder.update({
        where: { id },
        data: buildOrderUpdateData(input),
        include: paymentOrderUserInclude,
      })

      return serializePaymentOrderForAdmin(updatedOrder)
    } catch (error) {
      console.error('更新订单失败:', error)
      throw error instanceof Error ? error : new Error('更新订单失败')
    }
  },

  async getStats(): Promise<PaymentOrderStats> {
    try {
      const [totalOrders, pendingOrders, successOrders, failedOrders, refundedOrders, closedOrders] = await Promise.all(
        [
          prisma.paymentOrder.count(),
          prisma.paymentOrder.count({ where: { status: 'PENDING' } }),
          prisma.paymentOrder.count({ where: { status: 'SUCCESS' } }),
          prisma.paymentOrder.count({ where: { status: 'FAILED' } }),
          prisma.paymentOrder.count({ where: { status: 'REFUNDED' } }),
          prisma.paymentOrder.count({ where: { status: 'CLOSED' } }),
        ]
      )
      const [amountStats, successAmountStats] = await Promise.all([
        prisma.paymentOrder.aggregate({ _sum: { amount: true } }),
        prisma.paymentOrder.aggregate({
          where: { status: 'SUCCESS' },
          _sum: { amount: true },
        }),
      ])

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

export default PaymentOrderAdminService

function buildPaymentOrderWhere(input: ListPaymentOrdersInput): Prisma.PaymentOrderWhereInput {
  const q = input.filter?.trim() ?? ''

  return {
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
    ...(input.status ? { status: input.status } : {}),
    ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
    ...buildCreatedAtFilter(input.startDate, input.endDate),
  }
}

function buildCreatedAtFilter(startDate?: string, endDate?: string): Pick<Prisma.PaymentOrderWhereInput, 'createdAt'> {
  if (!startDate && !endDate) return {}

  return {
    createdAt: {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    },
  }
}

function buildPaymentOrderOrderBy(input: ListPaymentOrdersInput): Prisma.PaymentOrderOrderByWithRelationInput {
  if (input.sortBy && isValidPaymentOrderSortField(input.sortBy)) {
    return { [input.sortBy]: input.sortDir ?? 'desc' }
  }

  return { createdAt: 'desc' }
}

function buildStatusUpdateData(
  order: { paidAt: Date | null; metadata: unknown },
  input: UpdatePaymentOrderStatusInput
): Prisma.PaymentOrderUpdateInput {
  const updateData: Prisma.PaymentOrderUpdateInput = { status: input.status }

  if (input.status === 'SUCCESS' && !order.paidAt) {
    updateData.paidAt = new Date()
  }

  if (input.note) {
    updateData.metadata = appendStatusNote(order.metadata, input.note)
  }

  return updateData
}

function buildOrderUpdateData(input: UpdatePaymentOrderInput): Prisma.PaymentOrderUpdateInput {
  const updateData: Prisma.PaymentOrderUpdateInput = {}
  if (input.description !== undefined) updateData.description = input.description
  if (input.metadata !== undefined) updateData.metadata = input.metadata
  return updateData
}

function appendStatusNote(metadata: unknown, note: string): Prisma.InputJsonValue {
  const currentMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, Prisma.InputJsonValue>)
      : {}

  return {
    ...currentMetadata,
    statusNote: note,
    lastStatusChange: new Date().toISOString(),
  }
}
