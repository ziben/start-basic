/**
 * Payment Orders Primary Buttons - 主按钮组件
 */

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { paymentOrderKeys } from '../hooks/use-payment-orders'

export function PaymentOrdersPrimaryButtons() {
    const queryClient = useQueryClient()

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: paymentOrderKeys.all })
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
            </Button>
        </div>
    )
}
