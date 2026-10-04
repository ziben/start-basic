import { useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { ConfigValueType } from '../data/schema'
import { isTruthyBooleanInput } from '../utils/value-parser'

export type ValueEditorProps = {
    valueType: ConfigValueType
    value: string
    onChange: (v: string) => void
    stringArrayItems: string[]
    onArrayChange: (items: string[]) => void
}

export function ValueEditor({ valueType, value, onChange, stringArrayItems, onArrayChange }: ValueEditorProps): ReactElement {
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
