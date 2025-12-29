import { fetchJsonWithSchema } from '@/shared/lib/fetch-utils'
import { tasksPageSchema, type TasksPage } from '../../features/tasks'

export const tasksApi = {
  list: (params: {
    page: number
    pageSize: number
    filter?: string
    status?: string[]
    priority?: string[]
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    signal?: AbortSignal
  }): Promise<TasksPage> => {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    if (params.filter) qs.set('filter', params.filter)
    for (const s of params.status ?? []) qs.append('status', s)
    for (const p of params.priority ?? []) qs.append('priority', p)
    if (params.sortBy) qs.set('sortBy', params.sortBy)
    if (params.sortBy && params.sortDir) qs.set('sortDir', params.sortDir)

    const url = `/api/demo/tasks/?${qs.toString()}`
    return fetchJsonWithSchema(tasksPageSchema, url, { signal: params.signal })
  },
} as const
