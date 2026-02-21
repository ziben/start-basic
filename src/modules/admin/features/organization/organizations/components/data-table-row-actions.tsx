import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Pen, Trash2 } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Organization } from '../data/schema'
import { useOrganizations } from './organizations-provider'

type DataTableRowActionsProps = {
  row: Row<Organization>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { t } = useTranslation()
  const { setOpen, setCurrentRow } = useOrganizations()
  const organization = row.original

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentRow(organization)
          setOpen('update')
        }}
      >
        <Pen className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">{t('admin.common.edit')}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentRow(organization)
          setOpen('delete')
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">{t('admin.common.delete')}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('admin.common.openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Add future secondary actions here */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
