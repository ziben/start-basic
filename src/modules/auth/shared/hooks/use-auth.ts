import { useQuery } from '@tanstack/react-query'
import { authQueryKeys } from '~/shared/lib/query-keys'
import { authClient } from '@/modules/auth/shared/lib/auth-client'
import { CACHE_TIME } from '~/shared/lib/query-client'

export function useAuth() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => {
      try {
        const sessionResponse = await authClient.getSession()
        if (sessionResponse?.data?.user) {
          return sessionResponse.data
        }
        return null
      } catch {
        return null
      }
    },
    staleTime: CACHE_TIME.MEDIUM,
    gcTime: 10 * 60 * 1000, // 会话缓存保留时间短于普通查询
  })
}


