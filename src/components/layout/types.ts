import { type LinkProps } from '@tanstack/react-router'

type User = {
  name: string
  email: string
  avatar: string
}

type Team = {
  name: string
  // logo may be a React component (ElementType) or a serialized identifier from DB
  logo: React.ElementType | string
  plan: string
}

type SerializableTeam = Omit<Team, 'logo'> & {
  logo: string
}

type BaseNavItem = {
  title: string
  badge?: string
  // icon may be resolved to a React component or be a string identifier from DB
  icon?: React.ElementType | string
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type SerializableNavLink = {
  title: string
  url: string
  badge?: string
  icon?: string
}

type SerializableNavCollapsible = {
  title: string
  badge?: string
  icon?: string
  items: SerializableNavLink[]
}

type SerializableNavItem = SerializableNavLink | SerializableNavCollapsible

type NavGroup = {
  title: string
  items: NavItem[]
}

type SerializableNavGroup = {
  title: string
  items: SerializableNavItem[]
}

type SidebarData = {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

type SerializableSidebarData = {
  user: User
  teams: SerializableTeam[]
  navGroups: SerializableNavGroup[]
}

export type {
  SidebarData,
  SerializableSidebarData,
  SerializableNavGroup,
  SerializableNavItem,
  SerializableNavCollapsible,
  SerializableNavLink,
  NavGroup,
  NavItem,
  NavCollapsible,
  NavLink,
}
