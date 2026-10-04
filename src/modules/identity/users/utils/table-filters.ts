type ColumnFilterLike = {
  id: string
  value: unknown
}

export function getSingleBooleanFromArrayFilter(
  columnFilters: ColumnFilterLike[],
  columnId: string
): boolean | undefined {
  const raw = columnFilters.find((f) => f.id === columnId)?.value
  if (!Array.isArray(raw)) return undefined

  const values = raw.filter((v) => typeof v === 'string') as string[]
  if (values.length !== 1) return undefined

  if (values[0] === 'true') return true
  if (values[0] === 'false') return false
  return undefined
}
