import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { useTranslation } from "~/hooks/useTranslation"
import { AdminNavItem } from "../data/schema"
import { useAdminNavItemContext } from "../context/admin-navitem-context"
import { Eye, EyeOff, Pencil, Trash } from "lucide-react"
import { useToggleNavItemVisibility } from "~/hooks/useNavitemApi"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
        isVisible: !isCurrentlyVisible
      })
      
      toast.success(
        t('admin.navitem.toast.visibilitySuccess.title', { defaultMessage: '可见性更新成功' }),
        { description: t('admin.navitem.toast.visibilitySuccess.description', { defaultMessage: '导航项可见性已更新' }) }
      )
    } catch (error) {
      toast.error(
        t('admin.navitem.toast.visibilityError.title', { defaultMessage: '可见性更新失败' }),
        { description: String(error) }
      )
    }
  }

  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        {/* 编辑按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t('admin.navitem.actions.edit', { defaultMessage: '编辑' })}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.navitem.actions.edit', { defaultMessage: '编辑' })}</p>
          </TooltipContent>
        </Tooltip>

        {/* 删除按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
              <span className="sr-only">{t('admin.navitem.actions.delete', { defaultMessage: '删除' })}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.navitem.actions.delete', { defaultMessage: '删除' })}</p>
          </TooltipContent>
        </Tooltip>

        {/* 可见性切换按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleVisibility}>
              {navitem.badge !== '隐藏' ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {navitem.badge !== '隐藏' 
                  ? t('admin.navitem.actions.hide', { defaultMessage: '隐藏' })
                  : t('admin.navitem.actions.show', { defaultMessage: '显示' })
                }
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {navitem.badge !== '隐藏' 
                ? t('admin.navitem.actions.hide', { defaultMessage: '隐藏' })
                : t('admin.navitem.actions.show', { defaultMessage: '显示' })
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
