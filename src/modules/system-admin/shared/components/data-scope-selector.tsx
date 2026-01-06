/**
 * 数据范围选择器组件
 * 用于选择权限的数据访问范围
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface DataScopeSelectorProps {
    value?: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

const dataScopeOptions = [
    { value: 'ALL', label: '全部数据', description: '可访问所有数据', color: 'bg-red-100 text-red-800' },
    { value: 'ORG', label: '本组织', description: '仅本组织数据', color: 'bg-blue-100 text-blue-800' },
    { value: 'DEPT', label: '本部门', description: '仅本部门数据', color: 'bg-green-100 text-green-800' },
    { value: 'DEPT_AND_SUB', label: '本部门及子部门', description: '本部门及其子部门数据', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SELF', label: '仅自己', description: '仅自己的数据', color: 'bg-gray-100 text-gray-800' },
]

export function DataScopeSelector({
    value = 'SELF',
    onValueChange,
    disabled = false,
}: DataScopeSelectorProps) {
    const selectedOption = dataScopeOptions.find(opt => opt.value === value)

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger>
                <SelectValue>
                    {selectedOption && (
                        <div className='flex items-center gap-2'>
                            <Badge variant='outline' className={`text-xs ${selectedOption.color}`}>
                                {selectedOption.label}
                            </Badge>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {dataScopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        <div className='flex flex-col gap-1'>
                            <div className='flex items-center gap-2'>
                                <Badge variant='outline' className={`text-xs ${option.color}`}>
                                    {option.label}
                                </Badge>
                            </div>
                            <span className='text-xs text-muted-foreground'>{option.description}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
