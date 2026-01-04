/**
 * 部门树组件
 */
import { ChevronRight, ChevronDown, Building2, Users, MoreVertical, Plus, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Department } from '../../../../shared/hooks/use-department-api'
interface DepartmentTreeProps {
    departments: Department[]
    onAdd?: (parentId?: string) => void
    onEdit?: (department: Department) => void
    onDelete?: (department: Department) => void
}
export function DepartmentTree({ departments, onAdd, onEdit, onDelete }: DepartmentTreeProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }
    const renderDepartment = (dept: Department, level: number = 0) => {
        const hasChildren = dept.children && dept.children.length > 0
        const isExpanded = expandedIds.has(dept.id)
        const memberCount = dept.members?.length || 0
        return (
            <div key={dept.id} className="select-none">
                <div
                    className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent transition-colors ${level > 0 ? 'ml-6' : ''
                        }`}
                >
                    {/* 展开/收起按钮 */}
                    <button
                        onClick={() => toggleExpand(dept.id)}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent-foreground/10"
                    >
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )
                        ) : (
                            <span className="w-4" />
                        )}
                    </button>
                    {/* 部门图标 */}
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {/* 部门名称 */}
                    <span className="flex-1 font-medium">{dept.name}</span>
                    {/* 部门编码 */}
                    <Badge variant="outline" className="text-xs">
                        {dept.code}
                    </Badge>
                    {/* 成员数量 */}
                    {memberCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{memberCount}</span>
                        </div>
                    )}
                    {/* 状态 */}
                    {dept.status === 'INACTIVE' && (
                        <Badge variant="secondary" className="text-xs">
                            已停用
                        </Badge>
                    )}
                    {/* 操作菜单 */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAdd?.(dept.id)}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加子部门
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(dept)}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(dept)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* 子部门 */}
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {dept.children!.map(child => renderDepartment(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }
    if (departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">暂无部门</p>
                <Button onClick={() => onAdd?.()} className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    创建第一个部门
                </Button>
            </div>
        )
    }
    return (
        <div className="space-y-1">
            {departments.map(dept => renderDepartment(dept))}
        </div>
    )
}