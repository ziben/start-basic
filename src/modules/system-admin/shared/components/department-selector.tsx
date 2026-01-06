/**
 * 部门选择器组件
 * 用于在表单中选择部门，支持层级显示
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDepartmentsQuery } from '../../features/organization/departments/hooks/use-departments-query'
import type { Department } from '../../features/organization/departments/data/schema'

interface DepartmentSelectorProps {
    organizationId: string
    value?: string | null
    onValueChange: (value: string | undefined) => void
    placeholder?: string
    disabled?: boolean
}

export function DepartmentSelector({
    organizationId,
    value,
    onValueChange,
    placeholder = '选择部门',
    disabled = false,
}: DepartmentSelectorProps) {
    const { departments, isLoading } = useDepartmentsQuery({ organizationId })

    return (
        <Select
            value={value || '__none__'}
            onValueChange={(v) => onValueChange(v === '__none__' ? undefined : v)}
            disabled={disabled || isLoading}
        >
            <SelectTrigger>
                <SelectValue placeholder={isLoading ? '加载中...' : placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value='__none__'>无</SelectItem>
                {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                        {'  '.repeat(dept.level - 1)}
                        {dept.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
