/**
 * Payment Order Hooks - 订单管理前端数据钩子
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getPaymentOrdersFn,
    getPaymentOrderFn,
    getPaymentOrderStatsFn,
    updatePaymentOrderStatusFn,
    updatePaymentOrderFn,
} from '../server-fns/payment-order.fn'
import type { PaymentStatus, PaymentMethod } from '~/generated/prisma/browser'

// ============ Query Keys ============

export const paymentOrderKeys = {
    all: ['admin', 'payment-orders'] as const,
    lists: () => [...paymentOrderKeys.all, 'list'] as const,
    list: (filters: PaymentOrderFilters) => [...paymentOrderKeys.lists(), filters] as const,
    details: () => [...paymentOrderKeys.all, 'detail'] as const,
    detail: (id: string) => [...paymentOrderKeys.details(), id] as const,
    stats: () => [...paymentOrderKeys.all, 'stats'] as const,
}

// ============ Types ============

export interface PaymentOrderFilters {
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

// ============ Query Hooks ============

/**
 * 查询订单列表
 */
export function usePaymentOrdersQuery(filters: PaymentOrderFilters = {}) {
    return useQuery({
        queryKey: paymentOrderKeys.list(filters),
        queryFn: () => getPaymentOrdersFn({ data: filters }),
        staleTime: 30 * 1000, // 30秒
    })
}

/**
 * 查询单个订单
 */
export function usePaymentOrderQuery(id: string, enabled = true) {
    return useQuery({
        queryKey: paymentOrderKeys.detail(id),
        queryFn: () => getPaymentOrderFn({ data: { id } }),
        staleTime: 60 * 1000, // 1分钟
        enabled: enabled && !!id,
    })
}

/**
 * 查询订单统计
 */
export function usePaymentOrderStatsQuery() {
    return useQuery({
        queryKey: paymentOrderKeys.stats(),
        queryFn: () => getPaymentOrderStatsFn({ data: {} }),
        staleTime: 5 * 60 * 1000, // 5分钟
    })
}

// ============ Mutation Hooks ============

/**
 * 更新订单状态
 */
export function useUpdatePaymentOrderStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { id: string; status: PaymentStatus; note?: string }) =>
            updatePaymentOrderStatusFn({ data }),
        onSuccess: (updatedOrder, variables) => {
            // 刷新订单详情缓存
            queryClient.invalidateQueries({
                queryKey: paymentOrderKeys.detail(variables.id),
            })
            // 刷新订单列表缓存
            queryClient.invalidateQueries({
                queryKey: paymentOrderKeys.lists(),
            })
            // 刷新统计缓存
            queryClient.invalidateQueries({
                queryKey: paymentOrderKeys.stats(),
            })
        },
    })
}

/**
 * 更新订单信息
 */
export function useUpdatePaymentOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { id: string; description?: string; metadata?: unknown }) => updatePaymentOrderFn({ data }),
        onSuccess: (updatedOrder, variables) => {
            // 刷新订单详情缓存
            queryClient.invalidateQueries({
                queryKey: paymentOrderKeys.detail(variables.id),
            })
            // 刷新订单列表缓存
            queryClient.invalidateQueries({
                queryKey: paymentOrderKeys.lists(),
            })
        },
    })
}
