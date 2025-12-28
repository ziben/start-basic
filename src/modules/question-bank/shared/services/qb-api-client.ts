import { fetchJson } from '~/lib/api-client'

export const qbApiClient = {
  categories: {
    list: (params?: { tree?: boolean }) => {
      const qs = new URLSearchParams()
      if (params?.tree) qs.set('tree', '1')
      const url = qs.toString() ? `/api/question-bank/categories?${qs.toString()}` : '/api/question-bank/categories'
      return fetchJson<unknown>(url)
    },
  },
} as const
