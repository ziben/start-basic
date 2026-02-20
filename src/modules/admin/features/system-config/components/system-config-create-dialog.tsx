import { type ReactElement, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CONFIG_VALUE_TYPES, configValueTypeSchema, type ConfigValueType } from '../data/schema'
import { useCreateSystemConfig } from '../hooks/use-system-config-query'

// ─── Create Form Schema ───────────────────────────────────────────────────────

const createFormSchema = z.object({
    key: z
        .string()
        .min(1, 'Key 不能为空')
        .regex(
            /^[a-z0-9][a-z0-9._-]*$/,
            'Key 只允许小写字母、数字、点、横线、下划线，且不能以点或横线开头',
        ),
    value: z.string(),
    category: z.string().min(1, '分类不能为空'),
    valueType: configValueTypeSchema,
    isSecret: z.boolean(),
    isPublic: z.boolean(),
    isEnabled: z.boolean(),
    description: z.string(),
})

type CreateForm = z.infer<typeof createFormSchema>

const VALUE_TYPE_LABELS: Record<ConfigValueType, string> = {
    STRING: 'STRING（字符串）',
    NUMBER: 'NUMBER（数字）',
    BOOLEAN: 'BOOLEAN（布尔值）',
    JSON: 'JSON（对象）',
    STRING_ARRAY: 'STRING_ARRAY（字符串数组）',
}

// ─── Value Input ──────────────────────────────────────────────────────────────

function ValueInput({
    valueType,
    value,
    onChange,
}: {
    valueType: ConfigValueType
    value: string
    onChange: (v: string) => void
}): ReactElement {
    if (valueType === 'BOOLEAN') {
        return (
            <Select value={value || 'false'} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='true'>true</SelectItem>
                    <SelectItem value='false'>false</SelectItem>
                </SelectContent>
            </Select>
        )
    }

    if (valueType === 'JSON' || valueType === 'STRING_ARRAY') {
        const placeholder =
            valueType === 'JSON'
                ? '{"key": "value"}'
                : '["item1", "item2"]（每行一个，或 JSON 数组格式）'
        return (
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className='min-h-[100px] font-mono text-xs'
                spellCheck={false}
            />
        )
    }

    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={valueType === 'NUMBER' ? '0' : '配置值'}
            type={valueType === 'NUMBER' ? 'number' : 'text'}
        />
    )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

type Props = {
    open: boolean
    onClose: () => void
}

export function SystemConfigCreateDialog({ open, onClose }: Props): ReactElement {
    const createMutation = useCreateSystemConfig()
    const [boolItems, setBoolItems] = useState<string[]>([])

    const form = useForm<CreateForm>({
        resolver: zodResolver(createFormSchema) as never,
        defaultValues: {
            key: '',
            value: '',
            category: 'system',
            valueType: 'STRING',
            isSecret: false,
            isPublic: false,
            isEnabled: true,
            description: '',
        },
    })

    const valueType = form.watch('valueType')

    // 切换类型时重置 value，避免脏数据
    useEffect(() => {
        form.setValue('value', valueType === 'BOOLEAN' ? 'false' : '')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueType])

    useEffect(() => {
        if (!open) {
            form.reset()
            setBoolItems([])
        }
    }, [open, form])

    const onSubmit = (data: CreateForm): void => {
        const promise = createMutation.mutateAsync({
            key: data.key,
            value: data.value,
            category: data.category,
            valueType: data.valueType,
            isSecret: data.isSecret,
            isPublic: data.isPublic,
            isEnabled: data.isEnabled,
            description: data.description || null,
        })

        toast.promise(promise, {
            loading: '正在创建配置…',
            success: (res) => {
                onClose()
                return `配置 "${res.key}" 创建成功`
            },
            error: (err) => getErrorMessage(err),
        })
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader className='text-start'>
                    <DialogTitle>新增配置</DialogTitle>
                    <DialogDescription>创建一条新的运行时系统配置，创建后即可通过编辑修改值。</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id='system-config-create-form'
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-4 overflow-y-auto max-h-[60vh] py-1 px-0.5'
                    >
                        {/* Key */}
                        <FormField
                            control={form.control}
                            name='key'
                            render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                                    <FormLabel className='col-span-2 text-end'>
                                        Key <span className='text-destructive'>*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='app.feature.name'
                                            className='col-span-4 font-mono text-xs'
                                            autoComplete='off'
                                            spellCheck={false}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className='col-span-4 col-start-3 text-xs' />
                                </FormItem>
                            )}
                        />

                        {/* Category */}
                        <FormField
                            control={form.control}
                            name='category'
                            render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                                    <FormLabel className='col-span-2 text-end'>
                                        分类 <span className='text-destructive'>*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='system'
                                            className='col-span-4'
                                            autoComplete='off'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className='col-span-4 col-start-3 text-xs' />
                                </FormItem>
                            )}
                        />

                        {/* Value Type */}
                        <FormField
                            control={form.control}
                            name='valueType'
                            render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                                    <FormLabel className='col-span-2 text-end'>
                                        类型 <span className='text-destructive'>*</span>
                                    </FormLabel>
                                    <div className='col-span-4'>
                                        <Select value={field.value} onValueChange={(v) => field.onChange(v as ConfigValueType)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONFIG_VALUE_TYPES.map((vt) => (
                                                    <SelectItem key={vt} value={vt} className='font-mono text-xs'>
                                                        {VALUE_TYPE_LABELS[vt]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage className='col-span-4 col-start-3 text-xs' />
                                </FormItem>
                            )}
                        />

                        {/* Value */}
                        <FormField
                            control={form.control}
                            name='value'
                            render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                                    <FormLabel className='col-span-2 pt-2 text-end'>值</FormLabel>
                                    <div className='col-span-4'>
                                        <FormControl>
                                            <ValueInput
                                                valueType={valueType}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage className='col-span-4 col-start-3 text-xs' />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name='description'
                            render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                                    <FormLabel className='col-span-2 pt-2 text-end'>描述</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder='说明该配置项的用途'
                                            className='col-span-4 min-h-[60px] resize-none'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className='col-span-4 col-start-3 text-xs' />
                                </FormItem>
                            )}
                        />

                        {/* Toggles */}
                        <div className='grid grid-cols-6 gap-x-4 gap-y-3'>
                            <span className='col-span-2 text-end text-sm text-muted-foreground self-start pt-1'>选项</span>
                            <div className='col-span-4 space-y-3'>
                                <FormField
                                    control={form.control}
                                    name='isEnabled'
                                    render={({ field }) => (
                                        <FormItem className='flex items-center gap-3 space-y-0'>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className='font-normal cursor-pointer'>启用</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='isPublic'
                                    render={({ field }) => (
                                        <FormItem className='flex items-center gap-3 space-y-0'>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className='font-normal cursor-pointer'>公开（前端可读）</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='isSecret'
                                    render={({ field }) => (
                                        <FormItem className='flex items-center gap-3 space-y-0'>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className='font-normal cursor-pointer'>敏感值（界面遮盖）</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </form>
                </Form>

                <DialogFooter>
                    <Button variant='outline' onClick={onClose} disabled={createMutation.isPending}>
                        取消
                    </Button>
                    <Button
                        type='submit'
                        form='system-config-create-form'
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? '创建中…' : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
