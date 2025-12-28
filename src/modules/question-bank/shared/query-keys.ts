export const QB_QUERY_KEY = ['qb'] as const

export const QB_QUERY_KEYS = {
  all: QB_QUERY_KEY,
  questions: {
    all: [...QB_QUERY_KEY, 'questions'] as const,
    list: (filters?: any) => [...QB_QUERY_KEY, 'questions', 'list', filters] as const,
    detail: (id: string) => [...QB_QUERY_KEY, 'questions', 'detail', id] as const,
  },
  categories: {
    all: [...QB_QUERY_KEY, 'categories'] as const,
    list: (params?: any) => [...QB_QUERY_KEY, 'categories', 'list', params] as const,
    detail: (id: string) => [...QB_QUERY_KEY, 'categories', 'detail', id] as const,
  },
  tags: {
    all: [...QB_QUERY_KEY, 'tags'] as const,
    list: (filters?: any) => [...QB_QUERY_KEY, 'tags', 'list', filters] as const,
  },
  practice: {
    all: [...QB_QUERY_KEY, 'practice'] as const,
    sessions: () => [...QB_QUERY_KEY, 'practice', 'sessions'] as const,
  },
} as const
