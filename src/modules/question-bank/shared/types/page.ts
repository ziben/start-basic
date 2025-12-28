export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}
