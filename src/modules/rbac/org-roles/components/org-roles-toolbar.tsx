import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useOrgRolesContext } from "../context/org-roles-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Cross2Icon } from "@radix-ui/react-icons"
import { RefreshCw } from "lucide-react"

export function OrgRolesToolbar({ onReload, isReloading }: { onReload?: () => void, isReloading?: boolean }) {
  const { t } = useTranslation()
  const { tableUrl } = useOrgRolesContext()
  const isFiltered = !!tableUrl.globalFilter

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t('admin.orgRole.searchPlaceholder')}
          value={tableUrl.globalFilter ?? ""}
          onChange={(event) => tableUrl.onGlobalFilterChange?.(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => tableUrl.onGlobalFilterChange?.("")}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.common.resetFilters')}
            <Cross2Icon className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onReload && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onReload}
            disabled={isReloading}
          >
            <RefreshCw className={isReloading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
          </Button>
        )}
      </div>
    </div>
  )
}
