import React, { createContext, useContext, useState, useMemo } from 'react'
import type { Role } from '@/generated/prisma/client'
import { useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { useNavigate, useSearch } from '@tanstack/react-router'

type DialogState = {
  isOpen: boolean
  role?: Role | null
}

type RolesContextType = {
  createDialog: DialogState
  editDialog: DialogState
  deleteDialog: DialogState
  permissionsDialog: DialogState
  openCreateDialog: () => void
  openEditDialog: (role: Role) => void
  openDeleteDialog: (role: Role) => void
  openPermissionsDialog: (role: Role) => void
  closeCreateDialog: () => void
  closeEditDialog: () => void
  closeDeleteDialog: () => void
  closePermissionsDialog: () => void
  tableUrl: ReturnType<typeof useTableUrlState>
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/admin/rbac/roles' })
  
  const tableUrl = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'scope', searchKey: 'scope', type: 'array' },
      { columnId: 'isActive', searchKey: 'isActive', type: 'array' },
    ],
  })

  const [createDialog, setCreateDialog] = useState<DialogState>({ isOpen: false })
  const [editDialog, setEditDialog] = useState<DialogState>({ isOpen: false })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ isOpen: false })
  const [permissionsDialog, setPermissionsDialog] = useState<DialogState>({ isOpen: false })

  const value = useMemo(() => ({
    createDialog,
    editDialog,
    deleteDialog,
    permissionsDialog,
    openCreateDialog: () => setCreateDialog({ isOpen: true }),
    openEditDialog: (role: Role) => setEditDialog({ isOpen: true, role }),
    openDeleteDialog: (role: Role) => setDeleteDialog({ isOpen: true, role }),
    openPermissionsDialog: (role: Role) => setPermissionsDialog({ isOpen: true, role }),
    closeCreateDialog: () => setCreateDialog({ isOpen: false }),
    closeEditDialog: () => setEditDialog({ isOpen: false }),
    closeDeleteDialog: () => setDeleteDialog({ isOpen: false }),
    closePermissionsDialog: () => setPermissionsDialog({ isOpen: false }),
    tableUrl,
  }), [createDialog, editDialog, deleteDialog, permissionsDialog, tableUrl])

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export function useRolesContext() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRolesContext must be used within RolesProvider')
  }
  return context
}
