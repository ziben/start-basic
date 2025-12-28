export const QB_QUERY_KEY = ['qb'] as const

export const qbQueryKeys = {
  root: () => QB_QUERY_KEY,
  questions: () => [...QB_QUERY_KEY, 'questions'] as const,
  categories: () => [...QB_QUERY_KEY, 'categories'] as const,
  tags: () => [...QB_QUERY_KEY, 'tags'] as const,
  practice: () => [...QB_QUERY_KEY, 'practice'] as const,
  analytics: () => [...QB_QUERY_KEY, 'analytics'] as const,
} as const
