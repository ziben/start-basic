import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useOrganizationsListQuery } from "@/modules/system-admin/features/organization/organizations/hooks/use-organizations-list-query"

interface OrganizationSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export function OrganizationSelect({ value, onValueChange }: OrganizationSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { data: organizations, isLoading } = useOrganizationsListQuery({
    pageIndex: 0,
    pageSize: 100, // 获取前100个组织，通常管理后台够用了
    sorting: [],
  })

  const selectedOrg = organizations.find((org) => org.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between h-8 text-xs"
        >
          {selectedOrg ? selectedOrg.name : "选择组织..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="搜索组织..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "加载中..." : "未找到组织"}</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {org.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
