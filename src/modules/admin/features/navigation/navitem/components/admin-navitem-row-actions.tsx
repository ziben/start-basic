import { Row } from '@tanstack/react-table'
import { Eye, EyeOff, Pencil, Trash, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useToggleNavItemVisibility } from '~/modules/admin/shared/hooks/use-navitem-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminNavItemContext } from '../context/admin-navitem-context'
import { AdminNavItem } from '../data/schema'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const navitem = row.original as AdminNavItem
  const { setEditDialogOpen, setDeleteDialogOpen, setSelectedNavItem } = useAdminNavItemContext()

  const handleEdit = () => {
    setSelectedNavItem(navitem)
    setEditDialogOpen(true)
  }

  const handleDelete = () => {
    setSelectedNavItem(navitem)
    setDeleteDialogOpen(true)
  }

  // 切换导航项可见性
  const toggleVisibilityMutation = useToggleNavItemVisibility()

  const handleToggleVisibility = async () => {
    try {
      // 使用badge字段来判断当前是否可见
      const isCurrentlyVisible = navitem.badge !== '隐藏'
      await toggleVisibilityMutation.mutateAsync({
        id: navitem.id,
        isVisible: !isCurrentlyVisible,
      })

      toast.success(t('admin.navitem.toast.visibilitySuccess.title'), {
        description: t('admin.navitem.toast.visibilitySuccess.description'),
      })
    } catch (error) {
      toast.error(t('admin.navitem.toast.visibilityError.title'), { description: String(error) })
    }
  }

  return (
    <div className='flex items-center justify-end gap-2'>
      <TooltipProvider>
        {/* 编辑按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleEdit}>
              <Pencil className='h-4 w-4 text-muted-foreground' />
              <span className='sr-only'>{t('admin.navitem.actions.edit')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.navitem.actions.edit')}</p>
          </TooltipContent>
        </Tooltip>

        {/* 删除按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleDelete}>
              <Trash className='h-4 w-4 text-destructive' />
              <span className='sr-only'>{t('admin.navitem.actions.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.navitem.actions.delete')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleToggleVisibility}>
            {navitem.badge !== '隐藏' ? (
              <EyeOff className='mr-2 h-4 w-4 text-muted-foreground' />
            ) : (
              <Eye className='mr-2 h-4 w-4 text-muted-foreground' />
            )}
            {navitem.badge !== '隐藏' ? t('admin.navitem.actions.hide') : t('admin.navitem.actions.show')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}





