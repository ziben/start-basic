import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { PaymentOrdersProvider } from './payment-orders-provider'
import { PaymentOrdersTable } from './payment-orders-table'
import { PaymentOrdersDialogs } from './payment-orders-dialogs'
import { AppHeaderMain } from '~/components/layout/app-header-main'

const route = getRouteApi('/_authenticated/admin/payment/orders')

export default function PaymentOrdersPage() {
    const { t } = useTranslation()
    const search = route.useSearch()
    const navigate = route.useNavigate()

    return (
        <PaymentOrdersProvider>
            <AppHeaderMain fixed>
                <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t('admin.payment.title')}</h2>
                        <p className="text-muted-foreground">{t('admin.payment.desc')}</p>
                    </div>
                </div>
                <div className="-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1">
                    <PaymentOrdersTable search={search} navigate={navigate as unknown as NavigateFn} />
                </div>
            </AppHeaderMain>

            <PaymentOrdersDialogs />
        </PaymentOrdersProvider>
    )
}
