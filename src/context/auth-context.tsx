import { useRouteContext } from '@tanstack/react-router'
import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react'

type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading'

interface AuthContextType {
  status: AuthStatus
  setStatus: (status: AuthStatus) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useRouteContext({ from: '__root__' })
  const [status, setStatus] = useState<AuthStatus>(() => (user ? 'authenticated' : 'unauthenticated'))

  useEffect(() => {
    setStatus(user ? 'authenticated' : 'unauthenticated')
  }, [user])

  const value = useMemo(
    () => ({
      status,
      setStatus,
      isAuthenticated: status === 'authenticated',
    }),
    [status, setStatus]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}