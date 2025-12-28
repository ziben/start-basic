import type { ElementType } from 'react'
import * as LucideIcons from 'lucide-react'

// 将数据库获取的图标名称转换为组件的函数类型
export type IconResolver = (iconName?: string | null) => ElementType | undefined

/**
 * 图标解析器函数，将字符串图标名称转换为组件
 * @param iconName 图标名称
 * @returns 对应的图标组件或undefined
 */
export const iconResolver: IconResolver = (iconName) => {
  if (!iconName) return undefined

  // 处理 Lucide 图标：先 cast 为 unknown 再到 Record<string, ElementType>
  const lucide = LucideIcons as unknown as Record<string, ElementType>
  const resolved = lucide[iconName]
  if (resolved) return resolved

  // 规范化名称（支持 kebab-case / snake_case / lowercase）
  const normalize = (name: string) =>
    name.replace(/[-_\s]+(.)?/g, (_m, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (m) => m.toUpperCase())

  const pascal = normalize(iconName)
  if (lucide[pascal]) return lucide[pascal]

  // 常见别名映射（可扩展）
  const aliases: Record<string, string> = {
    'arrow-right': 'ArrowRight',
    'chevron-right': 'ChevronRight',
    menu: 'Menu',
    // add more aliases if needed
  }
  const aliasKey = iconName.toLowerCase()
  if (aliases[aliasKey] && lucide[aliases[aliasKey]]) return lucide[aliases[aliasKey]]

  // 找不到时返回 undefined
  return undefined
}
