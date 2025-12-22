import React, { useState, useMemo } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type AdminUsers } from '../data/schema'

type AdminUsersDialogType = 'create' | 'update' | 'delete' | 'import'

type AdminUsersContextType = {
  open: AdminUsersDialogType | null
  setOpen: (str: AdminUsersDialogType | null) => void
  currentRow: AdminUsers | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminUsers | null>>
}

const AdminUsersContext = React.createContext<AdminUsersContextType | null>(null)

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<AdminUsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<AdminUsers | null>(null)

  const value = useMemo(
    () => ({ open, setOpen, currentRow, setCurrentRow }),
    [open, setOpen, currentRow, setCurrentRow]
  )

  return <AdminUsersContext value={value}>{children}</AdminUsersContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminUsers = () => {
  const adminUsersContext = React.useContext(AdminUsersContext)

  if (!adminUsersContext) {
    throw new Error('useAdminUsers has to be used within <AdminUsersContext>')
  }

  return adminUsersContext
}
