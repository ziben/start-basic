export type TreeNode<T extends { id: string; parentId?: string | null }> = T & {
  children?: Array<TreeNode<T>>
}

export function buildTree<T extends { id: string; parentId?: string | null }>(items: T[]): Array<TreeNode<T>> {
  const map = new Map<string, TreeNode<T>>()
  const roots: Array<TreeNode<T>> = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)
    if (!node) continue

    const parentId = item.parentId ?? null
    if (!parentId) {
      roots.push(node)
      continue
    }

    const parent = map.get(parentId)
    if (!parent) {
      roots.push(node)
      continue
    }

    parent.children = parent.children ?? []
    parent.children.push(node)
  }

  return roots
}
