import React from 'react'
import { useDialogRowState } from '@/hooks/use-dialog-row-state'
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
  const value = useDialogRowState<AdminUsersDialogType, AdminUsers>()

  return <AdminUsersContext value={value}>{children}</AdminUsersContext>
}

export const useAdminUsers = () => {
  const adminUsersContext = React.useContext(AdminUsersContext)

  if (!adminUsersContext) {
    throw new Error('useAdminUsers has to be used within <AdminUsersContext>')
  }

  return adminUsersContext
}
