import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createSidebarData } from '~/components/layout/data/sidebar-data'
import type { SidebarData, NavItem } from '~/components/layout/types'
import { useTranslation } from '~/hooks/useTranslation'
import { getSidebarDataFn } from './api'
import { iconResolver as defaultIconResolver, type IconResolver } from '~/utils/icon-resolver'
import { Menu } from 'lucide-react'

// 用于获取侧边栏数据的React Query键
export const SIDEBAR_QUERY_KEY = ['sidebar']

/**
 * 处理侧边栏数据的React Hook，包括数据获取、翻译和处理
 * @param iconResolver 可选的图标解析器，将字符串转换为组件
 * @returns 处理后的侧边栏数据和加载状态
 */
export function useSidebar(iconResolver?: IconResolver) {
  const { t } = useTranslation()
  const [localData, setLocalData] = useState<SidebarData | null>(null)

  // 从API获取侧边栏数据
  const { data, isLoading, error } = useQuery({
    queryKey: SIDEBAR_QUERY_KEY,
    queryFn: () => getSidebarDataFn(),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false,
  })
  console.info('Sidebar hook data:', { data, localData, isLoading, error })
  // 处理翻译和图标解析
  useEffect(() => {
    if (data && !localData) {
      // 处理翻译和图标，使用传入的解析器或默认解析器
      const processedData = processSidebarData(data as SidebarData, t, iconResolver ?? defaultIconResolver)
      setLocalData(processedData)
    }
  }, [data, localData, t, iconResolver])

  // console.info('Sidebar hook data:', { data, localData, isLoading, error })

  // 如果出错或加载中且没有本地数据，使用默认数据
  if ((error || isLoading) && !localData) {
    // 创建默认的侧边栏数据
    const defaultData = createSidebarData(t)
    return {
      data: defaultData,
      isLoading,
      error,
    }
  }

  return {
    data: localData || data || createSidebarData(t),
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
        logo: processIcon(t.logo as any, iconResolver),
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
function processNavItems(items: any[], translate: (key: string) => string, iconResolver: IconResolver): NavItem[] {
  return items.map((item) => {
    // 处理基本属性：入参可能是从后端直接来的原始结构（icon 可能是字符串），这里做一次映射
    const processedItem: any = {
      ...item,
      title: translate(item.title), // 翻译标题或返回原文本
      icon: processIcon(item.icon, iconResolver),
    }

    // 递归处理子项
    if (item.items && item.items.length > 0) {
      return {
        ...processedItem,
        items: processNavItems(item.items, translate, iconResolver),
      } as NavItem
    }

    return processedItem as NavItem
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
