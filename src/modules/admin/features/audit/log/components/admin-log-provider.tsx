import { createContext, useContext, type ReactNode, useMemo, useCallback, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { type LogType, type SystemLog, type AuditLog } from '../data/schema'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminLog = SystemLog | AuditLog

type AdminLogContextValue = {
  type: LogType
  setType: (type: LogType) => void
  selectedLog: AdminLog | null
  setSelectedLog: (log: AdminLog | null) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AdminLogContext = createContext<AdminLogContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

const route = getRouteApi('/_authenticated/admin/log')

type RouteSearch = { type?: LogType }

export function AdminLogProvider({ children }: { children: ReactNode }) {
  const search = route.useSearch() as RouteSearch
  const navigate = route.useNavigate()

  const type: LogType = search.type === 'audit' ? 'audit' : 'system'

  const setType = useCallback(
    (newType: LogType) => {
      void navigate({ search: (prev: RouteSearch) => ({ ...prev, type: newType, page: undefined }) })
    },
    [navigate],
  )

  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  const value = useMemo(
    () => ({ type, setType, selectedLog, setSelectedLog }),
    [type, setType, selectedLog],
  )

  return <AdminLogContext value={value}>{children}</AdminLogContext>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminLogContext(): AdminLogContextValue {
  const context = useContext(AdminLogContext)
  if (!context) {
    throw new Error('useAdminLogContext must be used within <AdminLogProvider>')
  }
  return context
}
