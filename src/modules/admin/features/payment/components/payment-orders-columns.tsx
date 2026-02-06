import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn, formatDate } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { type PaymentOrder } from '../data/schema'
import { usePaymentOrdersContext } from './payment-orders-provider'

export function usePaymentOrdersColumns(): ColumnDef<PaymentOrder>[] {
    const { t } = useTranslation()
    const { setSelectedOrder, setDetailDialogOpen, setUpdateStatusDialogOpen } = usePaymentOrdersContext()

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('已复制到剪贴板')
        } catch {
            toast.error('复制失败')
        }
    }

    return useMemo(
        () => [
            {
                accessorKey: 'outTradeNo',
                header: ({ column }) => <DataTableColumnHeader column={column} title="订单号" />,
                cell: ({ row }) => {
                    const value = row.getValue('outTradeNo') as string
                    return (
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">{value.slice(-12)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(value)}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    )
                },
                meta: { className: 'w-40', title: '订单号' },
            },
            {
                accessorKey: 'user',
                header: ({ column }) => <DataTableColumnHeader column={column} title="用户" />,
                cell: ({ row }) => {
                    const user = row.original.user
                    if (!user) return <div className="text-muted-foreground">-</div>
                    return (
                        <div className="flex flex-col gap-0.5">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                    )
                },
                meta: { className: 'w-48', title: '用户' },
                enableSorting: false,
            },
            {
                accessorKey: 'amountYuan',
                header: ({ column }) => <DataTableColumnHeader column={column} title="金额" />,
                cell: ({ row }) => {
                    const amount = row.getValue('amountYuan') as string
                    return <div className="font-medium">¥{amount}</div>
                },
                meta: { className: 'w-24', title: '金额' },
            },
            {
                accessorKey: 'status',
                header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
                cell: ({ row }) => {
                    const status = row.getValue('status') as string
                    const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
                        PENDING: {
                            label: '待支付',
                            variant: 'outline',
                            className: 'border-yellow-300 bg-yellow-50 text-yellow-700',
                        },
                        SUCCESS: {
                            label: '已支付',
                            variant: 'outline',
                            className: 'border-green-300 bg-green-50 text-green-700',
                        },
                        FAILED: {
                            label: '支付失败',
                            variant: 'outline',
                            className: 'border-red-300 bg-red-50 text-red-700',
                        },
                        REFUNDED: {
                            label: '已退款',
                            variant: 'outline',
                            className: 'border-blue-300 bg-blue-50 text-blue-700',
                        },
                        CLOSED: {
                            label: '已关闭',
                            variant: 'outline',
                            className: 'border-gray-300 bg-gray-50 text-gray-700',
                        },
                    }
                    const config = statusConfig[status] || statusConfig.PENDING
                    return (
                        <Badge variant={config.variant as any} className={config.className}>
                            {config.label}
                        </Badge>
                    )
                },
                meta: { className: 'w-24', title: '状态' },
            },
            {
                accessorKey: 'paymentMethod',
                header: ({ column }) => <DataTableColumnHeader column={column} title="支付方式" />,
                cell: ({ row }) => {
                    const method = row.getValue('paymentMethod') as string
                    const methodLabels: Record<string, string> = {
                        WECHAT_JSAPI: '微信JSAPI',
                        WECHAT_NATIVE: '微信扫码',
                        WECHAT_H5: '微信H5',
                        ALIPAY: '支付宝',
                    }
                    return <Badge variant="secondary">{methodLabels[method] || method}</Badge>
                },
                meta: { className: 'w-32', title: '支付方式' },
            },
            {
                accessorKey: 'description',
                header: ({ column }) => <DataTableColumnHeader column={column} title="描述" />,
                cell: ({ row }) => {
                    const value = row.getValue('description') as string
                    return (
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={value}>
                            {value}
                        </div>
                    )
                },
                meta: { className: 'w-48', title: '描述' },
                enableSorting: false,
            },
            {
                accessorKey: 'createdAt',
                header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
                cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.getValue('createdAt'))}</div>,
                meta: { className: 'w-40', title: '创建时间' },
            },
            {
                accessorKey: 'paidAt',
                header: ({ column }) => <DataTableColumnHeader column={column} title="支付时间" />,
                cell: ({ row }) => {
                    const value = row.getValue('paidAt')
                    return <div className="text-muted-foreground">{value ? formatDate(value as string | Date) : '-'}</div>
                },
                meta: { className: 'w-40', title: '支付时间' },
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedOrder(row.original)
                                setDetailDialogOpen(true)
                            }}
                        >
                            详情
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedOrder(row.original)
                                setUpdateStatusDialogOpen(true)
                            }}
                        >
                            更新状态
                        </Button>
                    </div>
                ),
                meta: { className: 'w-48' },
            },
        ],
        [t, setSelectedOrder, setDetailDialogOpen, setUpdateStatusDialogOpen]
    )
}
