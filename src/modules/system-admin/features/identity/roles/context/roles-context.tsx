import React, { createContext, useContext, useMemo, useState } from 'react'
import { useUrlSyncedSorting } from '@/shared/hooks/use-url-synced-sorting'
import useDialogState from '@/shared/hooks/use-dialog-state'
import { getRouteApi } from '@tanstack/react-router'
import type { SystemRole } from '../data/schema'

const route = getRouteApi('/admin/roles')

interface RolesContextType {
  tableUrl: ReturnType<typeof useUrlSyncedSorting>
  currentRow: SystemRole | null
  setCurrentRow: (row: SystemRole | null) => void
  open: 'create' | 'update' | 'delete' | 'assign' | null
  setOpen: (open: 'create' | 'update' | 'delete' | 'assign' | null) => void
}

const RolesContext = createContext<RolesContextType | null>(null)

export const RolesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const tableUrl = useUrlSyncedSorting({
    search: search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const [currentRow, setCurrentRow] = useState<SystemRole | null>(null)
  const [open, setOpen] = useDialogState<'create' | 'update' | 'delete' | 'assign'>(null)

  const value = useMemo(
    () => ({
      tableUrl,
      currentRow,
      setCurrentRow,
      open,
      setOpen,
    }),
    [tableUrl, currentRow, open, setOpen, setCurrentRow]
  )

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export const useRolesContext = () => {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRolesContext must be used within a RolesProvider')
  }
  return context
}
