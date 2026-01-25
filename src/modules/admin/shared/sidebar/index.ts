import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import { createSidebarData } from '~/components/layout/data/sidebar-data'
import type { SidebarData, NavItem, NavCollapsible, NavLink } from '~/components/layout/types'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { iconResolver as defaultIconResolver, type IconResolver } from '@/shared/utils/icon-resolver'
import { sidebarQueryKeys } from '~/shared/lib/query-keys'
import { getSidebarDataFn } from './api'

/**
 * 处理侧边栏数据的React Hook，包括数据获取、翻译和处理
 * @param iconResolver 可选的图标解析器，将字符串转换为组件
 * @returns 处理后的侧边栏数据和加载状态
 */
export function useSidebar(iconResolver?: IconResolver, scope: 'APP' | 'ADMIN' = 'APP') {
  const { t } = useTranslation()

  // 从API获取侧边栏数据
  const { data, isLoading, error } = useQuery({
    queryKey: sidebarQueryKeys.list(scope),
    queryFn: ({ signal }) => getSidebarDataFn({ data: scope, signal }),
    staleTime: 10 * 1000, // 10秒内视为新鲜数据
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30秒轮询，保证别的管理员改了 DB 也能刷新
  })

  const processedData = useMemo(() => {
    if (!data) return null
    return processSidebarData(data as SidebarData, t, iconResolver ?? defaultIconResolver)
  }, [data, t, iconResolver])

  // console.info('Sidebar hook data:', { data, localData, isLoading, error })

  // 如果出错或加载中且没有本地数据，使用默认数据
  if ((error || isLoading) && !processedData) {
    // 创建默认的侧边栏数据
    const defaultData = createSidebarData(t)
    return {
      data: defaultData,
      isLoading,
      error,
    }
  }

  return {
    data: processedData || data || createSidebarData(t),
    isLoading,
    error,
  }
}

/**
 * 处理侧边栏数据，将字符串翻译和解析图标
 */
function processSidebarData(
  data: SidebarData,
  translate: (key: string) => string,
  iconResolver: IconResolver
): SidebarData {
  return {
    ...data,
    // 使用服务器返回的数据（已被序列化为字符串标识），在客户端解析为组件
    teams:
      data.teams?.map((t) => ({
        ...t,
        logo: processIcon(t.logo as string, iconResolver),
      })) ?? [],
    navGroups: data.navGroups.map((group) => ({
      ...group,
      // 允许传入的 title 为翻译 key 或者已经是展示文本，translate 会尝试返回翻译文本
      title: translate(group.title),
      items: processNavItems(group.items, translate, iconResolver),
    })),
  }
}

/**
 * 递归处理导航项
 */
function processNavItems(
  items: NavItem[],
  translate: (key: string) => string,
  iconResolver: IconResolver
): NavItem[] {
  return items.map((item) => {
    // 处理基本属性：入参可能是从后端直接来的原始结构（icon 可能是字符串），这里做一次映射
    const title = translate(item.title)
    const icon = processIcon(item.icon as string, iconResolver)

    // 递归处理子项
    if ('items' in item && item.items && item.items.length > 0) {
      return {
        ...item,
        title,
        icon,
        items: processNavItems(item.items, translate, iconResolver),
      } as NavCollapsible
    }

    return {
      ...item,
      title,
      icon,
    } as NavLink
  })
}

/**
 * 处理图标，将字符串转换为组件
 */
function processIcon(iconName: string | null | undefined, iconResolver: IconResolver): React.ElementType | string {
  // 如果没有传入图标名称，返回默认的 Menu 名称字符串
  if (!iconName) return Menu

  // 使用传入的解析器去解析图标名称；如果解析失败，返回一个默认的 Menu 组件作为回退
  const resolved = iconResolver(iconName)
  return resolved ?? Menu
}







