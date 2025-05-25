import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "~/hooks/useTranslation"
import { AdminNavgroup } from "../data/schema"
import { useAdminNavgroupContext } from "../context/admin-navgroup-context"
import { Eye, Pencil, Trash, List } from "lucide-react"
import { Link } from "@tanstack/react-router"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const navgroup = row.original as AdminNavgroup
  const { setEditDialogOpen, setDeleteDialogOpen, setSelectedNavgroup } = useAdminNavgroupContext()

  const handleEdit = () => {
    setSelectedNavgroup(navgroup)
    setEditDialogOpen(true)
  }

  const handleDelete = () => {
    setSelectedNavgroup(navgroup)
    setDeleteDialogOpen(true)
  }

  // 这里可以添加其他操作，如修改可见性等

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t('admin.navgroup.actions.openMenu', { defaultMessage: '打开菜单' })}</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('admin.navgroup.actions.edit', { defaultMessage: '编辑' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" />
          {t('admin.navgroup.actions.delete', { defaultMessage: '删除' })}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link 
            to="/admin/navitem"
            search={{ navGroupId: navgroup.id }}
            className="flex cursor-pointer items-center"
          >
            <List className="mr-2 h-4 w-4" />
            {t('admin.navgroup.actions.manageNavItems', { defaultMessage: '管理导航项' })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          {t('admin.navgroup.actions.visibility', { defaultMessage: '切换可见性' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
