import { useState, type ReactElement } from 'react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { SystemConfig, ConfigValueType } from '../data/schema'
import { normalizeValueByType, parseStringArray } from '../utils/value-parser'
import { useUpdateSystemConfig } from '../hooks/use-system-config-query'
import { ValueEditor } from './value-editor'

const VALUE_TYPE_HINT: Record<ConfigValueType, string> = {
    STRING: '任意字符串',
    NUMBER: '合法数字（整数或小数）',
    BOOLEAN: '开关切换 true / false',
    JSON: '合法 JSON 字符串',
    STRING_ARRAY: '字符串列表，回车或逗号添加',
}

export type EditDialogProps = {
    row: SystemConfig
    open: boolean
    onClose: () => void
}

export function SystemConfigEditDialog({ row, open, onClose }: EditDialogProps): ReactElement {
    const updateMutation = useUpdateSystemConfig()

    const initialArrayItems = row.valueType === 'STRING_ARRAY' ? parseStringArray(row.value) : []
    const initialValue = row.valueType === 'STRING_ARRAY' ? JSON.stringify(initialArrayItems) : row.value

    const [editValue, setEditValue] = useState(initialValue)
    const [editDescription, setEditDescription] = useState(row.description ?? '')
    const [editEnabled, setEditEnabled] = useState(row.isEnabled)
    const [editPublic, setEditPublic] = useState(row.isPublic)
    const [editNote, setEditNote] = useState('')
    const [stringArrayItems, setStringArrayItems] = useState<string[]>(initialArrayItems)

    const handleSave = async (): Promise<void> => {
        try {
            const normalizedValue = normalizeValueByType(editValue, row.valueType)
            await updateMutation.mutateAsync({
                id: row.id,
                value: normalizedValue,
                isEnabled: editEnabled,
                isPublic: editPublic,
                description: editDescription || null,
                note: editNote || undefined,
            })
            toast.success('配置已更新')
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '更新失败')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>编辑配置</DialogTitle>
                    <DialogDescription className='font-mono text-xs'>{row.key}</DialogDescription>
                </DialogHeader>

                <div className='grid gap-5'>
                    {/* Value */}
                    <div className='grid gap-2'>
                        <Label htmlFor='config-value'>
                            值
                            <Badge variant='outline' className='ml-2 font-mono text-xs'>
                                {row.valueType}
                            </Badge>
                        </Label>
                        <ValueEditor
                            valueType={row.valueType}
                            value={editValue}
                            onChange={setEditValue}
                            stringArrayItems={stringArrayItems}
                            onArrayChange={setStringArrayItems}
                        />
                        <p className='text-muted-foreground text-xs'>{VALUE_TYPE_HINT[row.valueType]}</p>
                    </div>

                    {/* Description */}
                    <div className='grid gap-2'>
                        <Label htmlFor='config-description'>描述</Label>
                        <Input
                            id='config-description'
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder='可选，说明此配置的用途'
                        />
                    </div>

                    {/* Toggles */}
                    <div className='flex items-center gap-8'>
                        <div className='flex items-center gap-2'>
                            <Switch id='enabled-switch' checked={editEnabled} onCheckedChange={setEditEnabled} />
                            <Label htmlFor='enabled-switch'>启用</Label>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Switch id='public-switch' checked={editPublic} onCheckedChange={setEditPublic} />
                            <Label htmlFor='public-switch'>公开（客户端可读）</Label>
                        </div>
                    </div>

                    {/* Note */}
                    <div className='grid gap-2'>
                        <Label htmlFor='config-note'>变更备注</Label>
                        <Input
                            id='config-note'
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder='记录本次修改原因，写入审计日志'
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={onClose} disabled={updateMutation.isPending}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? '保存中…' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
