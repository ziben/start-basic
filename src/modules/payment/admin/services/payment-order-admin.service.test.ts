import { expect, it, vi } from 'vitest'
import { PaymentOrderAdminService } from './payment-order-admin.service'

const groupBy = vi.hoisted(() => vi.fn())
vi.mock('@/shared/lib/db', () => ({ default: { paymentOrder: { groupBy } } }))

it('aggregates counts and amounts in one query, including missing statuses', async () => {
  groupBy.mockResolvedValue([
    { status: 'SUCCESS', _count: { _all: 2 }, _sum: { amount: 1200 } },
    { status: 'PENDING', _count: { _all: 1 }, _sum: { amount: 400 } },
  ])
  expect(await PaymentOrderAdminService.getStats()).toEqual({
    totalOrders: 3,
    pendingOrders: 1,
    successOrders: 2,
    failedOrders: 0,
    refundedOrders: 0,
    closedOrders: 0,
    totalAmount: 1600,
    successAmount: 1200,
  })
  expect(groupBy).toHaveBeenCalledTimes(1)
  groupBy.mockResolvedValue([])
  expect(await PaymentOrderAdminService.getStats()).toMatchObject({ totalOrders: 0, totalAmount: 0, successAmount: 0 })
})
