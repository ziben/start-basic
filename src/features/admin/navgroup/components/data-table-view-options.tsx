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
                {column.id === "name" 
                  ? t('admin.navgroup.table.name', { defaultMessage: "名称" })
                  : column.id === "icon" 
                  ? t('admin.navgroup.table.icon', { defaultMessage: "图标" })
                  : column.id === "order" 
                  ? t('admin.navgroup.table.order', { defaultMessage: "排序" })
                  : column.id === "description" 
                  ? t('admin.navgroup.table.description', { defaultMessage: "描述" })
                  : column.id === "isVisible" 
                  ? t('admin.navgroup.table.status', { defaultMessage: "状态" })
                  : column.id === "createdAt" 
                  ? t('admin.navgroup.table.createdAt', { defaultMessage: "创建时间" })
                  : column.id === "updatedAt" 
                  ? t('admin.navgroup.table.updatedAt', { defaultMessage: "更新时间" })
                  : column.id
                }
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
