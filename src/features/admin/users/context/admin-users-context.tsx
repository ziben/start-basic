import React, { useState } from 'react'
import { AdminUsers } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'

type AdminUsersDialogType = 'add' | 'edit' | 'delete'

interface AdminUsersContextType {
  open: AdminUsersDialogType | null
  setOpen: (str: AdminUsersDialogType | null) => void
  currentRow: AdminUsers | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminUsers | null>>
}

const AdminUsersContext = React.createContext<AdminUsersContextType | null>(null)

interface Props {
  readonly children: React.ReactNode
}

export default function AdminUsersProvider({ children }: Props) {
  const [open, setOpen] = useState<AdminUsersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<AdminUsers | null>(null)

  // 使用useMemo优化Context Provider的值
  const contextValue = React.useMemo(() => ({
    open,
    setOpen,
    currentRow,
    setCurrentRow
  }), [open, currentRow])

  return (
    <AdminUsersContext.Provider value={contextValue}>
      {children}
    </AdminUsersContext.Provider>
  )
}

export const useAdminUsers = () => {
  const { t } = useTranslation()
  const ctx = React.useContext(AdminUsersContext)
  if (!ctx) throw new Error(t('admin.users.context.error') || 'useAdminUsers必须在AdminUsersProvider中使用')
  return ctx
} 