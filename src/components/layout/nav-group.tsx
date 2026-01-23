import { type ReactNode, useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { type NavCollapsible, type NavItem, type NavLink, type NavGroup as NavGroupProps } from './types'
import { useTabs } from '@/shared/context/tab-context'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  const storageKey = `nav_collapsible_state_${title}`
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(openMap))
  }, [openMap, storageKey])
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, idx) => {
          // 生成稳定 key：优先使用字符串类型的 url，否则回退到索引
          const urlPart = typeof item.url === 'string' ? item.url : String(idx)
          const baseKey = `${item.title}-${urlPart}`
          const key = item.items ? `${baseKey}-${href}` : baseKey

          if (!item.items) return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />

          return (
            <SidebarMenuCollapsible
              key={key}
              item={item}
              href={href}
              itemKey={baseKey}
              openMap={openMap}
              setOpenMap={setOpenMap}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const tabContext = useTabs()

  const handleClick = (e: React.MouseEvent) => {
    if (!tabContext) {
      return // Fall back to normal navigation
    }

    e.preventDefault()
    tabContext.openTab(item.url, item.title, item.icon)
    setOpenMobile(false)
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={checkIsActive(href, item)} tooltip={item.title}>
        <a href={item.url} onClick={handleClick}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
  itemKey,
  openMap,
  setOpenMap,
}: {
  item: NavCollapsible
  href: string
  itemKey: string
  openMap: Record<string, boolean>
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  const { setOpenMobile } = useSidebar()
  const tabContext = useTabs()
  const isActive = checkIsActive(href, item, true)
  const open = openMap[itemKey] ?? isActive

  const handleOpenChange = (nextOpen: boolean) => {
    setOpenMap((prev) => ({ ...prev, [itemKey]: nextOpen }))
  }

  const handleSubItemClick = (subItem: NavLink) => (e: React.MouseEvent) => {
    if (!tabContext) {
      return // Fall back to normal navigation
    }

    e.preventDefault()
    tabContext.openTab(subItem.url, subItem.title, subItem.icon)
    setOpenMobile(false)
  }

  return (
    <Collapsible asChild open={open} onOpenChange={handleOpenChange} className='group/collapsible'>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild isActive={checkIsActive(href, subItem)}>
                  <a href={subItem.url} onClick={handleSubItemClick(subItem)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({ item, href }: { item: NavCollapsible; href: string }) {
  const tabContext = useTabs()

  const handleSubItemClick = (subItem: NavLink) => (e: React.MouseEvent) => {
    if (!tabContext) {
      return // Fall back to normal navigation
    }

    e.preventDefault()
    tabContext.openTab(subItem.url, subItem.title, subItem.icon)
  }

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={checkIsActive(href, item)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <a href={sub.url} onClick={handleSubItemClick(sub)} className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}>
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && <span className='ms-auto text-xs'>{sub.badge}</span>}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  const cleanHref = href.split('?')[0]
  return (
    href === item.url || // /endpint?search=param
    cleanHref === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href || i.url === cleanHref).length || // if child nav is active
    (mainNav && href.split('/')[1] !== '' && href.split('/')[1] === item?.url?.split('/')[1])
  )
}

