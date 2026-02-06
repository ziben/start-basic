/**
 * Payment Orders Provider - Context管理
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { type PaymentOrder } from '../data/schema'

interface PaymentOrdersContextValue {
    selectedOrder: PaymentOrder | null
    setSelectedOrder: (order: PaymentOrder | null) => void
    detailDialogOpen: boolean
    setDetailDialogOpen: (open: boolean) => void
    updateStatusDialogOpen: boolean
    setUpdateStatusDialogOpen: (open: boolean) => void
}

const PaymentOrdersContext = createContext<PaymentOrdersContextValue | undefined>(undefined)

export function usePaymentOrdersContext() {
    const context = useContext(PaymentOrdersContext)
    if (!context) {
        throw new Error('usePaymentOrdersContext must be used within PaymentOrdersProvider')
    }
    return context
}

interface PaymentOrdersProviderProps {
    children: ReactNode
}

export function PaymentOrdersProvider({ children }: PaymentOrdersProviderProps) {
    const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false)

    return (
        <PaymentOrdersContext.Provider
            value={{
                selectedOrder,
                setSelectedOrder,
                detailDialogOpen,
                setDetailDialogOpen,
                updateStatusDialogOpen,
                setUpdateStatusDialogOpen,
            }}
        >
            {children}
        </PaymentOrdersContext.Provider>
    )
}
