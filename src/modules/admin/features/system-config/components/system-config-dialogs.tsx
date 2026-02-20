/**
 * system-config-dialogs.tsx
 *
 * 包含两个对话框:
 *   - SystemConfigEditDialog  — 编辑配置项 (值 / 描述 / enabled / public / 备注)
 *   - SystemConfigHistoryDialog — 查看变更历史，含 oldValue / newValue 差异对比
 *
 * 两者均通过 SystemConfigDialogs 统一挂载，由 SystemConfigContext 驱动开关与数据。
 */

import { useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SystemConfig, SystemConfigChange, ConfigValueType } from '../data/schema'
import { CHANGE_TYPE_LABELS } from '../data/schema'
import { normalizeValueByType, parseStringArray, isTruthyBooleanInput } from '../utils/value-parser'
import { useUpdateSystemConfig, useSystemConfigHistory } from '../hooks/use-system-config-query'
import { useSystemConfigContext } from './system-config-provider'

// ════════════════════════════════════════════════════════════════════════════════
// Value Editor — 按 valueType 渲染不同输入控件
// ════════════════════════════════════════════════════════════════════════════════

type ValueEditorProps = {
  valueType: ConfigValueType
  value: string
  onChange: (v: string) => void
  stringArrayItems: string[]
  onArrayChange: (items: string[]) => void
}

function ValueEditor({ valueType, value, onChange, stringArrayItems, onArrayChange }: ValueEditorProps): ReactElement {
  const [draft, setDraft] = useState('')

  const addItem = (raw: string): void => {
    const next = raw.trim()
    if (!next || stringArrayItems.includes(next)) {
      setDraft('')
      return
    }
    const updated = [...stringArrayItems, next]
    onArrayChange(updated)
    onChange(JSON.stringify(updated))
    setDraft('')
  }

  const removeItem = (item: string): void => {
    const updated = stringArrayItems.filter((i) => i !== item)
    onArrayChange(updated)
    onChange(JSON.stringify(updated))
  }

  if (valueType === 'BOOLEAN') {
    const checked = isTruthyBooleanInput(value)
    return (
      <div className='flex items-center gap-3 rounded-md border px-3 py-2'>
        <Switch
          id='config-value-boolean'
          checked={checked}
          onCheckedChange={(v) => onChange(v ? 'true' : 'false')}
        />
        <Label htmlFor='config-value-boolean' className='text-sm font-mono'>
          {checked ? 'true' : 'false'}
        </Label>
      </div>
    )
  }

  if (valueType === 'NUMBER') {
    return (
      <Input
        id='config-value'
        type='number'
        inputMode='decimal'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='font-mono'
      />
    )
  }

  if (valueType === 'STRING') {
    return (
      <Input
        id='config-value'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='font-mono'
      />
    )
  }

  if (valueType === 'STRING_ARRAY') {
    return (
      <div className='space-y-1.5'>
        <div className='flex min-h-10 flex-wrap items-center gap-2 rounded-md border px-2 py-2 focus-within:ring-1 focus-within:ring-ring'>
          {stringArrayItems.map((item) => (
            <Badge key={item} variant='secondary' className='gap-1 pr-1'>
              <span className='font-mono text-xs'>{item}</span>
              <button
                type='button'
                className='rounded p-0.5 hover:bg-muted'
                onClick={() => removeItem(item)}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
          <Input
            id='config-value-array'
            className='h-8 min-w-[180px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0 font-mono text-xs'
            placeholder='输入后回车或英文逗号添加…'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addItem(draft)
              }
              if (e.key === 'Backspace' && !draft && stringArrayItems.length > 0) {
                e.preventDefault()
                removeItem(stringArrayItems[stringArrayItems.length - 1])
              }
            }}
            onBlur={() => draft && addItem(draft)}
          />
        </div>
        <p className='text-muted-foreground text-xs font-mono'>
          将保存为: {value || '[]'}
        </p>
      </div>
    )
  }

  // JSON
  return (
    <Textarea
      id='config-value'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      className='font-mono text-xs'
      placeholder='输入合法 JSON…'
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// Edit Dialog
// ════════════════════════════════════════════════════════════════════════════════

const VALUE_TYPE_HINT: Record<ConfigValueType, string> = {
  STRING: '任意字符串',
  NUMBER: '合法数字（整数或小数）',
  BOOLEAN: '开关切换 true / false',
  JSON: '合法 JSON 字符串',
  STRING_ARRAY: '字符串列表，回车或逗号添加',
}

type EditDialogProps = {
  row: SystemConfig
  open: boolean
  onClose: () => void
}

function SystemConfigEditDialog({ row, open, onClose }: EditDialogProps): ReactElement {
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

// ════════════════════════════════════════════════════════════════════════════════
// History Dialog
// ════════════════════════════════════════════════════════════════════════════════

function ChangeTypeBadge({ changeType }: { changeType: string }): ReactElement {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    CREATE: 'default',
    UPDATE: 'secondary',
    DELETE: 'destructive',
    REFRESH: 'outline',
  }
  return (
    <Badge variant={variantMap[changeType] ?? 'outline'} className='whitespace-nowrap'>
      {CHANGE_TYPE_LABELS[changeType] ?? changeType}
    </Badge>
  )
}

function ValueDiff({ oldValue, newValue }: { oldValue: string | null; newValue: string | null }): ReactElement {
  if (oldValue === null && newValue === null) return <span className='text-muted-foreground text-xs'>—</span>

  return (
    <div className='space-y-0.5'>
      {oldValue !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='truncate max-w-[180px] font-mono text-xs text-red-500 line-through cursor-default'>
              {oldValue}
            </div>
          </TooltipTrigger>
          <TooltipContent className='max-w-[400px] break-all font-mono text-xs'>
            旧值: {oldValue}
          </TooltipContent>
        </Tooltip>
      )}
      {newValue !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='truncate max-w-[180px] font-mono text-xs text-green-600 cursor-default'>
              {newValue}
            </div>
          </TooltipTrigger>
          <TooltipContent className='max-w-[400px] break-all font-mono text-xs'>
            新值: {newValue}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

type HistoryDialogProps = {
  row: SystemConfig | null
  open: boolean
  onClose: () => void
}

function SystemConfigHistoryDialog({ row, open, onClose }: HistoryDialogProps): ReactElement {
  const historyQuery = useSystemConfigHistory(open && row ? row.id : undefined)

  const renderBody = (): ReactElement => {
    if (historyQuery.isLoading) {
      return (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 5 }).map((__, j) => (
                <TableCell key={j}><Skeleton className='h-4 w-full' /></TableCell>
              ))}
            </TableRow>
          ))}
        </>
      )
    }

    const items = historyQuery.data ?? []

    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
            暂无变更记录
          </TableCell>
        </TableRow>
      )
    }

    return (
      <>
        {items.map((item: SystemConfigChange) => (
          <TableRow key={item.id}>
            <TableCell className='whitespace-nowrap text-xs'>
              {new Date(item.createdAt).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              <ChangeTypeBadge changeType={item.changeType} />
            </TableCell>
            <TableCell className='text-xs'>
              {item.operatorName ?? item.operatorId ?? <span className='text-muted-foreground'>系统</span>}
            </TableCell>
            <TableCell>
              <ValueDiff oldValue={item.oldValue} newValue={item.newValue} />
            </TableCell>
            <TableCell className='text-xs text-muted-foreground'>
              {item.note ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>变更历史</DialogTitle>
          <DialogDescription className='font-mono text-xs'>{row?.key}</DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-auto rounded border'>
          <Table>
            <TableHeader className='sticky top-0 bg-background z-10'>
              <TableRow>
                <TableHead className='w-[160px]'>时间</TableHead>
                <TableHead className='w-[96px]'>操作</TableHead>
                <TableHead className='w-[120px]'>操作人</TableHead>
                <TableHead className='w-[200px]'>值变更</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderBody()}</TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// Unified Export
// ════════════════════════════════════════════════════════════════════════════════

import { SystemConfigCreateDialog } from './system-config-create-dialog'
import { SystemConfigDeleteDialog } from './system-config-delete-dialog'

export function SystemConfigDialogs(): ReactElement {
  const { open, setOpen, currentRow } = useSystemConfigContext()
  const close = (): void => setOpen(null)

  return (
    <>
      {/* 创建 */}
      <SystemConfigCreateDialog open={open === 'create'} onClose={close} />

      {/* 编辑 */}
      {currentRow ? (
        <SystemConfigEditDialog
          key={`edit-${currentRow.id}`}
          row={currentRow}
          open={open === 'edit'}
          onClose={close}
        />
      ) : null}

      {/* 历史 */}
      <SystemConfigHistoryDialog row={currentRow} open={open === 'history'} onClose={close} />

      {/* 删除 */}
      <SystemConfigDeleteDialog row={currentRow} open={open === 'delete'} onClose={close} />
    </>
  )
}
