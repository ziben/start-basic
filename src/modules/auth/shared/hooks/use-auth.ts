import { useQuery } from '@tanstack/react-query'
import { authQueryKeys } from '~/shared/lib/query-keys'
import { authClient } from '@/modules/auth/shared/lib/auth-client'

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}


