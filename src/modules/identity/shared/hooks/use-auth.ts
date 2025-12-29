import { useQuery } from '@tanstack/react-query'
import { authClient } from '@/modules/identity/shared/lib/auth-client'

export function useAuth() {
  return useQuery({
    queryKey: ['auth-session'],
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


