import React, { useState } from 'react'
import { AdminUser } from '../data/schema'

type AdminUserDialogType = 'add' | 'edit' | 'delete'

interface AdminUserContextType {
  open: AdminUserDialogType | null
  setOpen: (str: AdminUserDialogType | null) => void
  currentRow: AdminUser | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminUser | null>>
}

const AdminUserContext = React.createContext<AdminUserContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function AdminUserProvider({ children }: Props) {
  const [open, setOpen] = useState<AdminUserDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<AdminUser | null>(null)

  return (
    <AdminUserContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </AdminUserContext.Provider>
  )
}

export const useAdminUser = () => {
  const ctx = React.useContext(AdminUserContext)
  if (!ctx) throw new Error('useAdminUser必须在AdminUserProvider中使用')
  return ctx
} 