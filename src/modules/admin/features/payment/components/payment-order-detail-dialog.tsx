/**
 * Payment Order Detail Dialog - 订单详情对话框
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/shared/lib/utils'
import { usePaymentOrdersContext } from './payment-orders-provider'
import { Separator } from '@/components/ui/separator'

export function PaymentOrderDetailDialog() {
    const { selectedOrder, detailDialogOpen, setDetailDialogOpen } = usePaymentOrdersContext()

    if (!selectedOrder) return null

    const statusConfig: Record<string, { label: string; className: string }> = {
        PENDING: { label: '待支付', className: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
        SUCCESS: { label: '已支付', className: 'border-green-300 bg-green-50 text-green-700' },
        FAILED: { label: '支付失败', className: 'border-red-300 bg-red-50 text-red-700' },
        REFUNDED: { label: '已退款', className: 'border-blue-300 bg-blue-50 text-blue-700' },
        CLOSED: { label: '已关闭', className: 'border-gray-300 bg-gray-50 text-gray-700' },
    }

    const methodLabels: Record<string, string> = {
        WECHAT_JSAPI: '微信JSAPI',
        WECHAT_NATIVE: '微信扫码',
        WECHAT_H5: '微信H5',
        ALIPAY: '支付宝',
    }

    const config = statusConfig[selectedOrder.status] || statusConfig.PENDING

    return (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>订单详情</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* 订单基本信息 */}
                    <div className="space-y-3">
                        <h3 className="font-medium">订单信息</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">订单号</div>
                                <div className="font-mono mt-1">{selectedOrder.outTradeNo}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">交易号</div>
                                <div className="font-mono mt-1">{selectedOrder.transactionId || '-'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">订单状态</div>
                                <div className="mt-1">
                                    <Badge variant="outline" className={config.className}>
                                        {config.label}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">支付方式</div>
                                <div className="mt-1">
                                    <Badge variant="secondary">{methodLabels[selectedOrder.paymentMethod]}</Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">订单金额</div>
                                <div className="font-semibold text-lg mt-1">¥{selectedOrder.amountYuan}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">商品描述</div>
                                <div className="mt-1">{selectedOrder.description}</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* 用户信息 */}
                    {selectedOrder.user && (
                        <>
                            <div className="space-y-3">
                                <h3 className="font-medium">用户信息</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">用户姓名</div>
                                        <div className="mt-1">{selectedOrder.user.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">用户邮箱</div>
                                        <div className="mt-1">{selectedOrder.user.email}</div>
                                    </div>
                                    {selectedOrder.user.username && (
                                        <div>
                                            <div className="text-muted-foreground">用户名</div>
                                            <div className="mt-1">{selectedOrder.user.username}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* 时间信息 */}
                    <div className="space-y-3">
                        <h3 className="font-medium">时间信息</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">创建时间</div>
                                <div className="mt-1">{formatDate(selectedOrder.createdAt)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">支付时间</div>
                                <div className="mt-1">{selectedOrder.paidAt ? formatDate(selectedOrder.paidAt) : '-'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">更新时间</div>
                                <div className="mt-1">{formatDate(selectedOrder.updatedAt)}</div>
                            </div>
                        </div>
                    </div>

                    {/* 元数据 */}
                    {selectedOrder.metadata && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-medium">元数据</h3>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {typeof selectedOrder.metadata === 'string'
                                        ? selectedOrder.metadata
                                        : JSON.stringify(selectedOrder.metadata, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
