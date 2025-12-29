import React, { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCategories, useDeleteCategory } from '../../../shared/hooks/use-categories-api'
import { Category } from '../../../shared/services/qb-api-client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { CategoryForm } from './category-form'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'

interface TreeNodeProps {
  node: Category
  level: number
  onEdit: (node: Category) => void
  onAddChild: (parentId: string) => void
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onEdit, onAddChild }) => {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const deleteMutation = useDeleteCategory()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(node.id)
      toast.success('分类已删除')
      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  return (
    <div className='select-none'>
      <div
        className={cn(
          'group flex items-center justify-between rounded-md py-2 px-2 hover:bg-accent/50',
          level > 0 && 'ml-6 border-l pl-4'
        )}
      >
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-accent',
              !hasChildren && 'invisible'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </div>
          <div className='text-muted-foreground'>
            {isOpen ? <FolderOpen className='h-4 w-4 text-primary/70' /> : <Folder className='h-4 w-4' />}
          </div>
          <span className='text-sm font-medium'>{node.name}</span>
          {node.description && (
            <span className='hidden text-xs text-muted-foreground group-hover:inline-block'>
              {node.description}
            </span>
          )}
        </div>

        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100'>
          <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onAddChild(node.id)}>
            <Plus className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onEdit(node)}>
            <Pencil className='h-4 w-4' />
          </Button>
          <Button 
            variant='ghost' 
            size='icon' 
            className='h-7 w-7 text-destructive hover:text-destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title='删除分类'
            desc={`确定要删除分类 "${node.name}" 吗？此操作不可撤销。`}
            handleConfirm={handleDelete}
            destructive
          />
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className='mt-1'>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CategoryTree: React.FC = () => {
  const { data: tree, isLoading } = useCategories({ tree: true })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [targetParentId, setTargetParentId] = useState<string | null>(null)

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setTargetParentId(category.parentId)
    setIsFormOpen(true)
  }

  const handleAddChild = (parentId: string) => {
    setEditingCategory(null)
    setTargetParentId(parentId)
    setIsFormOpen(true)
  }

  const handleCreateRoot = () => {
    setEditingCategory(null)
    setTargetParentId(null)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold tracking-tight'>题库分类</h2>
          <p className='text-sm text-muted-foreground'>管理题目层级结构</p>
        </div>
        <Button size='sm' onClick={handleCreateRoot}>
          <Plus className='mr-2 h-4 w-4' />
          新建根分类
        </Button>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {tree && tree.length > 0 ? (
            <div className='space-y-1'>
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  onEdit={handleEdit}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          ) : (
            <div className='flex h-32 flex-col items-center justify-center space-y-2 text-muted-foreground'>
              <Folder className='h-8 w-8 opacity-20' />
              <p>暂无分类数据</p>
              <Button variant='link' size='sm' onClick={handleCreateRoot}>
                创建第一个分类
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingCategory || undefined}
        parentId={targetParentId || undefined}
      />
    </div>
  )
}



