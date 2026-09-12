import type { ElementType } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  Bug,
  Building,
  ChevronRight,
  Construction,
  CreditCard,
  FileX,
  HelpCircle,
  Home,
  Key,
  Languages,
  LayoutDashboard,
  List,
  ListTodo,
  Lock,
  Mail,
  Menu,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  ScrollText,
  ServerOff,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserCog,
  Users,
  UserX,
  Wrench,
} from 'lucide-react'

// 将数据库获取的图标名称转换为组件的函数类型
export type IconResolver = (iconName?: string | null) => ElementType | undefined

// ponytail: curated persisted icons; add to this map when navigation needs another icon.
const availableIcons = {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  Bug,
  Building,
  ChevronRight,
  Construction,
  CreditCard,
  FileX,
  HelpCircle,
  Home,
  Key,
  Languages,
  LayoutDashboard,
  List,
  ListTodo,
  Lock,
  Mail,
  Menu,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  ScrollText,
  ServerOff,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserCog,
  Users,
  UserX,
  Wrench,
} satisfies Record<string, ElementType>

export const availableIconNames = Object.keys(availableIcons).sort()

export function toKebabIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

export function toPascalIconName(name: string): string {
  return name.replace(/(^|-)([a-z0-9])/g, (_match, _separator, character: string) => character.toUpperCase())
}

/**
 * 图标解析器函数，将字符串图标名称转换为组件
 * @param iconName 图标名称
 * @returns 对应的图标组件或undefined
 */
export const iconResolver: IconResolver = (iconName) => {
  if (!iconName) return undefined
  const name = toPascalIconName(toKebabIconName(iconName)) as keyof typeof availableIcons
  return availableIcons[name]
}

