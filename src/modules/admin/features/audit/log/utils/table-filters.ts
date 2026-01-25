export function getSingleBooleanFromArrayFilter(
  filters: Array<{ id: string; value: unknown }>,
  columnId: string
): boolean | undefined {
  const filter = filters.find((f) => f.id === columnId)
  if (!filter) return undefined
  const values = filter.value
  if (!Array.isArray(values)) return undefined
  const arr = values.map((v) => String(v)).filter(Boolean)
  if (arr.length !== 1) return undefined
  if (arr[0] === 'true') return true
  if (arr[0] === 'false') return false
  return undefined
}

export function getSingleStringFromArrayFilter(
  filters: Array<{ id: string; value: unknown }>,
  columnId: string
): string | undefined {
  const filter = filters.find((f) => f.id === columnId)
  if (!filter) return undefined
  const values = filter.value
  if (!Array.isArray(values)) return undefined
  const arr = values.map((v) => String(v)).filter(Boolean)
  if (arr.length !== 1) return undefined
  return arr[0]
}
