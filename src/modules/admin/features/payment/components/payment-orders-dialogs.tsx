/**
 * Payment Orders Dialogs - 对话框容器
 */

import { PaymentOrderDetailDialog } from './payment-order-detail-dialog'
import { UpdatePaymentOrderStatusDialog } from './update-payment-order-status-dialog'

export function PaymentOrdersDialogs() {
    return (
        <>
            <PaymentOrderDetailDialog />
            <UpdatePaymentOrderStatusDialog />
        </>
    )
}
