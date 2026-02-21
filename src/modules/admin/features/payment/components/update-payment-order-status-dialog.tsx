/**
 * Update Payment Order Status Dialog - 更新订单状态对话框
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { usePaymentOrdersContext } from './payment-orders-provider'
import { useUpdatePaymentOrderStatus } from '../hooks/use-payment-orders'
import type { PaymentStatus } from '~/generated/prisma/browser'

export function UpdatePaymentOrderStatusDialog() {
    const { selectedOrder, updateStatusDialogOpen, setUpdateStatusDialogOpen } = usePaymentOrdersContext()
    const updateStatus = useUpdatePaymentOrderStatus()

    const [status, setStatus] = useState<PaymentStatus>('PENDING')
    const [note, setNote] = useState('')

    const handleSubmit = async () => {
        if (!selectedOrder) return

        try {
            await updateStatus.mutateAsync({
                id: selectedOrder.id,
                status,
                note: note || undefined,
            })
            toast.success('订单状态已更新')
            setUpdateStatusDialogOpen(false)
            setNote('')
        } catch (error) {
            toast.error('更新失败：' + (error instanceof Error ? error.message : '未知错误'))
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setNote('')
        }
        setUpdateStatusDialogOpen(open)
    }

    if (!selectedOrder) return null

    return (
        <Dialog open={updateStatusDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>更新订单状态</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                            订单号: <span className="font-mono">{selectedOrder.outTradeNo}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            当前状态: <span className="font-semibold">{selectedOrder.status}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">新状态</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">待支付</SelectItem>
                                <SelectItem value="SUCCESS">已支付</SelectItem>
                                <SelectItem value="FAILED">支付失败</SelectItem>
                                <SelectItem value="REFUNDED">已退款</SelectItem>
                                <SelectItem value="CLOSED">已关闭</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">备注（可选）</Label>
                        <Textarea
                            id="note"
                            placeholder="输入状态变更备注..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateStatus.isPending}>
                        {updateStatus.isPending ? '更新中...' : '确认更新'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
