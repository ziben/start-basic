import { createContext, useContext, type ReactNode, useMemo, useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/admin/log' as any)

type RouteSearch = {
  type?: 'system' | 'audit'
}

type AdminLogProviderProps = {
  children: ReactNode
}

export function AdminLogProvider({ children }: AdminLogProviderProps) {
  const search = route.useSearch() as RouteSearch
  const navigate = route.useNavigate()

  const type: 'system' | 'audit' = search.type === 'audit' ? 'audit' : 'system'

  const setType = useCallback((newType: 'system' | 'audit') => {
    navigate({ search: (prev: any) => ({ ...prev, type: newType, page: undefined }) } as never)
  }, [navigate])

  const value = useMemo(
    () => ({
      type,
      setType,
    }),
    [type, setType]
  )

  return <AdminLogContext.Provider value={value}>{children}</AdminLogContext.Provider>
}

type AdminLogContextValue = {
  type: 'system' | 'audit'
  setType: (type: 'system' | 'audit') => void
}

const AdminLogContext = createContext<AdminLogContextValue | undefined>(undefined)

export function useAdminLogContext() {
  const context = useContext(AdminLogContext)
  if (!context) {
    throw new Error('useAdminLogContext must be used within AdminLogProvider')
  }
  return context
}

