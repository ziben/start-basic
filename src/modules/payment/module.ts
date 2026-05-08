import { defineModule } from '~/core/module-registry'
import { createPrepayOrder } from './shared/services/create-prepay-order.service'
import {
  closePaymentOrder,
  queryPaymentOrderStatus,
  syncPaymentOrderStatus,
} from './shared/services/payment-order-status.service'

export const paymentModule = defineModule({
  key: 'payment',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      createPrepayOrder,
      queryPaymentOrderStatus,
      syncPaymentOrderStatus,
      closePaymentOrder,
    },
    events: {
      orderPaid: 'payment.order.paid',
      orderClosed: 'payment.order.closed',
      orderFailed: 'payment.order.failed',
    },
  },
})

export type PaymentModule = typeof paymentModule
