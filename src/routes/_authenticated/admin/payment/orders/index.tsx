/**
 * Payment Orders Page - 订单管理主页面
 */

import { getRouteApi } from '@tanstack/react-router'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { PaymentOrdersProvider } from '~/modules/admin/features/payment/components/payment-orders-provider'
import { PaymentOrdersTable } from '~/modules/admin/features/payment/components/payment-orders-table'
import { PaymentOrdersDialogs } from '~/modules/admin/features/payment/components/payment-orders-dialogs'
import { AppHeaderMain } from '~/components/layout/app-header-main'

const route = getRouteApi('/_authenticated/admin/payment/orders')

export default function PaymentOrdersPage() {
    const search = route.useSearch()
    const navigate = route.useNavigate()

    return (
        <PaymentOrdersProvider>
            <AppHeaderMain>
                <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">订单管理</h2>
                        <p className="text-muted-foreground">管理平台所有支付订单，查看订单详情和更新订单状态</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
                    <PaymentOrdersTable search={search} navigate={navigate as unknown as NavigateFn} />
                </div>
            </AppHeaderMain>

            <PaymentOrdersDialogs />
        </PaymentOrdersProvider>
    )
}
