/**
 * Role 选择器组件
 * 基于 better-auth 配置的角色选择
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface RoleSelectorProps {
    value?: string | null
    onValueChange: (value: string | undefined) => void
    type?: 'global' | 'org'
    placeholder?: string
    disabled?: boolean
    allowNone?: boolean
}

// 全局角色（User.role）
const GLOBAL_ROLES = [
    { name: 'superadmin', label: '超级管理员', description: '拥有所有权限' },
    { name: 'admin', label: '管理员', description: '可以管理用户、组织、角色、权限' },
    { name: 'user', label: '普通用户', description: '只能管理自己的资料' },
]

// 组织角色（Member.role）
const ORG_ROLES = [
    { name: 'owner', label: '所有者', description: '组织所有者' },
    { name: 'admin', label: '管理员', description: '组织管理员' },
    { name: 'member', label: '成员', description: '组织成员' },
]

export function SystemRoleSelector({
    value,
    onValueChange,
    type = 'global',
    placeholder = '选择角色',
    disabled = false,
    allowNone = true,
}: RoleSelectorProps) {
    const roles = type === 'global' ? GLOBAL_ROLES : ORG_ROLES

    return (
        <Select
            value={value || '__none__'}
            onValueChange={(v) => onValueChange(v === '__none__' ? undefined : v)}
            disabled={disabled}
        >
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allowNone && <SelectItem value='__none__'>无</SelectItem>}
                {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                        <div className='flex items-center gap-2'>
                            <span>{role.label}</span>
                            <Badge variant='outline' className='text-xs'>
                                {role.name}
                            </Badge>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
