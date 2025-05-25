import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MixerHorizontalIcon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "~/hooks/useTranslation"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation()
  
  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      name: t('admin.navitem.table.name', { defaultMessage: "名称" }),
      path: t('admin.navitem.table.path', { defaultMessage: "路径" }),
      navgroupId: t('admin.navitem.table.navgroup', { defaultMessage: "所属导航组" }),
      icon: t('admin.navitem.table.icon', { defaultMessage: "图标" }),
      order: t('admin.navitem.table.order', { defaultMessage: "排序" }),
      isVisible: t('admin.navitem.table.status', { defaultMessage: "状态" }),
      external: t('admin.navitem.table.external', { defaultMessage: "外部链接" }),
      target: t('admin.navitem.table.target', { defaultMessage: "打开方式" }),
      createdAt: t('admin.navitem.table.createdAt', { defaultMessage: "创建时间" }),
      updatedAt: t('admin.navitem.table.updatedAt', { defaultMessage: "更新时间" }),
      description: t('admin.navitem.table.description', { defaultMessage: "描述" }),
    }
    
    return labels[columnId] || columnId
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          {t('admin.common.viewOptions', { defaultMessage: "列显示" })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>
          {t('admin.common.toggleColumns', { defaultMessage: "切换列显示" })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnLabel(column.id)}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
