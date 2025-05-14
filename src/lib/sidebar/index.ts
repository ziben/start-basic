import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createSidebarData } from '~/components/layout/data/sidebar-data'
import { SidebarData } from '~/components/layout/types'
import { useTranslation } from '~/hooks/useTranslation'
import { getSidebarDataFn } from '../../routes/api/sidebar/routes'

// 用于获取侧边栏数据的React Query键
export const SIDEBAR_QUERY_KEY = ['sidebar']

// 将数据库获取的图标名称转换为组件的函数类型
export type IconResolver = (iconName: string | null | undefined) => React.ElementType | undefined

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
    queryFn: () => getSidebarDataFn({}),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false,
  })

  // 处理翻译和图标解析
  useEffect(() => {
    if (data && !localData) {
      // 处理翻译和图标
      const processedData = processSidebarData(data, t, iconResolver)
      setLocalData(processedData)
    }
  }, [data, localData, t, iconResolver])

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
  iconResolver?: IconResolver
): SidebarData {
  return {
    ...data,
    navGroups: data.navGroups.map((group) => ({
      ...group,
      title: translate(group.title), // 翻译标题
      items: processNavItems(group.items, translate, iconResolver),
    })),
  }
}

/**
 * 递归处理导航项
 */
function processNavItems(items: any[], translate: (key: string) => string, iconResolver?: IconResolver): any[] {
  return items.map((item) => {
    // 处理基本属性
    const processedItem = {
      ...item,
      title: translate(item.title), // 翻译标题
      icon: processIcon(item.icon, iconResolver),
    }

    // 递归处理子项
    if (item.items && item.items.length > 0) {
      return {
        ...processedItem,
        items: processNavItems(item.items, translate, iconResolver),
      }
    }

    return processedItem
  })
}

/**
 * 处理图标，将字符串转换为组件
 */
function processIcon(iconName: string | null | undefined, iconResolver?: IconResolver): React.ElementType | undefined {
  if (!iconName || !iconResolver) {
    return undefined
  }

  return iconResolver(iconName)
}
