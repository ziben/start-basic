import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import { type AdminUser } from '../data/schema'

type AdminUserDialogType = 'create' | 'update' | 'delete' | 'import'

type AdminUserContextType = {
  open: AdminUserDialogType | null
  setOpen: (str: AdminUserDialogType | null) => void
  currentRow: AdminUser | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminUser | null>>
}

const AdminUsersContext = React.createContext<AdminUserContextType | null>(null)

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  const value = useDialogRowState<AdminUserDialogType, AdminUser>()

  return <AdminUsersContext value={value}>{children}</AdminUsersContext>
}

export const useAdminUsers = () => {
  const adminUsersContext = React.useContext(AdminUsersContext)

  if (!adminUsersContext) {
    throw new Error('useAdminUsers has to be used within <AdminUsersContext>')
  }

  return adminUsersContext
}




