import { createContext, useContext, ReactNode, useMemo, useState } from 'react'
import { useRouteContext } from '@tanstack/react-router'

type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading'

interface AuthContextType {
  status: AuthStatus
  setStatus: (status: AuthStatus) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useRouteContext({ from: '__root__' })
  const [manualStatus, setManualStatus] = useState<AuthStatus | null>(null)
  const status: AuthStatus = manualStatus ?? (user ? 'authenticated' : 'unauthenticated')

  const value = useMemo(
    () => ({
      status,
      setStatus: (next: AuthStatus) => setManualStatus(next),
      isAuthenticated: status === 'authenticated',
    }),
    [status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

/**
 * 快捷获取当前用户信息
 */
export const useAuth = () => {
  const { user } = useRouteContext({ from: '__root__' })
  return { user }
}

