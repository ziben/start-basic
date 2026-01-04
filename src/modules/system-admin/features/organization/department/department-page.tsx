/**
 * 部门管理页面
 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDepartmentTree, type Department } from '~/modules/system-admin/shared/hooks/use-department-api'
import { DepartmentTree } from './components/department-tree'
import { DepartmentDialog, DeleteDepartmentDialog } from './components/department-dialogs'
export default function DepartmentPage() {
  // TODO: 从用户 session 获取 organizationId
  const organizationId = 'temp-org-id'

  const { data: departments = [], isLoading } = useDepartmentTree(organizationId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
  const [parentId, setParentId] = useState<string | undefined>()
  const handleAdd = (parentDeptId?: string) => {
    setCurrentDepartment(null)
    setParentId(parentDeptId)
    setDialogOpen(true)
  }
  const handleEdit = (department: Department) => {
    setCurrentDepartment(department)
    setParentId(undefined)
    setDialogOpen(true)
  }
  const handleDelete = (department: Department) => {
    setCurrentDepartment(department)
    setDeleteDialogOpen(true)
  }
  return (
    <AppHeaderMain>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">部门管理</h2>
          <p className="text-muted-foreground">
            管理组织的部门结构和层级关系
          </p>
        </div>
        <Button onClick={() => handleAdd()}>
          <Plus className="mr-2 h-4 w-4" />
          创建部门
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>部门树</CardTitle>
          <CardDescription>
            组织的部门层级结构，支持多级嵌套
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </div>
            </div>
          ) : (
            <DepartmentTree
              departments={departments}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
      {/* 创建/编辑对话框 */}
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={currentDepartment}
        parentId={parentId}
        organizationId={organizationId}
        departments={departments}
      />
      {/* 删除确认对话框 */}
      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        department={currentDepartment}
        organizationId={organizationId}
      />
    </AppHeaderMain>
  )
}
