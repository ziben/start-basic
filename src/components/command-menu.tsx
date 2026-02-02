import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun, User, Building } from 'lucide-react'
import { globalSearchFn } from '~/modules/admin/shared/sidebar/search-api'
import { useSidebar } from '~/modules/admin/shared/sidebar'
import { iconResolver } from '@/shared/utils/icon-resolver'
import { useSearch } from '@/shared/context/search-provider'
import { useTheme } from '@/shared/context/theme-provider'
import { useTabs } from '@/shared/context/tab-context'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { NavCollapsible, NavGroup, NavLink, NavItem } from '@/components/layout/types'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const [search, setSearch] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<{ users: any[], orgs: any[] }>({ users: [], orgs: [] })

  React.useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults({ users: [], orgs: [] })
      return
    }

    const timer = setTimeout(async () => {
      const results = await globalSearchFn({ data: search })
      setSearchResults(results)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      setSearch('')
      command()
    },
    [setOpen]
  )

  const { data: appSidebar } = useSidebar(iconResolver, 'APP')
  const { data: adminSidebar } = useSidebar(iconResolver, 'ADMIN')

  const { tabs } = useTabs() || { tabs: [] }

  const navGroups = React.useMemo(() => {
    const groups: NavGroup[] = []

    // 1. Add Active Tabs as first group if any
    if (tabs.length > 0) {
      groups.push({
        title: 'Active Tabs',
        items: tabs.map(tab => ({
          title: tab.title,
          url: tab.path,
          icon: tab.icon || ArrowRight
        }))
      })
    }

    // Helper to add or merge groups from sidebars
    const addGroups = (sourceGroups: NavGroup[]) => {
      sourceGroups.forEach((sourceGroup) => {
        const existingGroup = groups.find((g) => g.title === sourceGroup.title)
        if (existingGroup) {
          sourceGroup.items.forEach((item) => {
            const itemKey = 'url' in item ? item.url : item.title
            const exists = existingGroup.items.some((i) => ('url' in i ? i.url === itemKey : i.title === itemKey))
            if (!exists) {
              existingGroup.items.push(item)
            }
          })
        } else {
          groups.push({ ...sourceGroup, items: [...sourceGroup.items] })
        }
      })
    }

    if (appSidebar) addGroups(appSidebar.navGroups)
    if (adminSidebar) addGroups(adminSidebar.navGroups)

    return groups
  }, [appSidebar, adminSidebar, tabs])

  const isNavLink = (item: NavItem): item is NavLink => 'url' in item

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder='Type a command or search...'
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {navGroups.map((group: NavGroup) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem: NavItem, i: number) => {
                if (isNavLink(navItem) && navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={`${group.title} ${navItem.title} ${navItem.url}`}
                      onSelect={() => {
                        runCommand(() => navigate({ to: navItem.url }))
                      }}
                    >
                      <div className='flex size-4 items-center justify-center'>
                        <ArrowRight className='size-2 text-muted-foreground/80' />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )

                return (navItem as NavCollapsible).items?.map((subItem, i) => (
                  <CommandItem
                    key={`${navItem.title}-${subItem.url}-${i}`}
                    value={`${group.title} ${navItem.title} ${subItem.title} ${subItem.url}`}
                    onSelect={() => {
                      runCommand(() => navigate({ to: subItem.url }))
                    }}
                  >
                    <div className='flex size-4 items-center justify-center'>
                      <ArrowRight className='size-2 text-muted-foreground/80' />
                    </div>
                    {navItem.title} <ChevronRight className='mx-1 h-3 w-3' /> {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}

          {searchResults.users.length > 0 && (
            <CommandGroup heading='Users'>
              {searchResults.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`user ${user.name} ${user.email}`}
                  onSelect={() => {
                    runCommand(() => navigate({ to: `/_authenticated/admin/users?filter=${user.id}` as any }))
                  }}
                >
                  <User className='size-4' />
                  <div className='flex flex-col'>
                    <span>{user.name}</span>
                    <span className='text-xs text-muted-foreground'>{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults.orgs.length > 0 && (
            <CommandGroup heading='Organizations'>
              {searchResults.orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={`org ${org.name} ${org.slug}`}
                  onSelect={() => {
                    runCommand(() => navigate({ to: `/_authenticated/admin/organization?filter=${org.id}` as any }))
                  }}
                >
                  <Building className='size-4' />
                  <div className='flex flex-col'>
                    <span>{org.name}</span>
                    <span className='text-xs text-muted-foreground'>{org.slug}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}






