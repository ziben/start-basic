import * as LucideIcons from 'lucide-react'

// 将数据库获取的图标名称转换为组件的函数类型
export type IconResolver = (iconName: string | null | undefined) => React.ElementType | undefined

/**
 * 图标解析器函数，将字符串图标名称转换为组件
 * @param iconName 图标名称
 * @returns 对应的图标组件或undefined
 */
export const iconResolver: IconResolver = (iconName) => {
  if (!iconName) return undefined

  // 处理Lucide图标
  const lucide = LucideIcons as Record<string, unknown>
  if (lucide[iconName]) {
    return lucide[iconName]
  }

  // 默认返回
  return undefined
}
