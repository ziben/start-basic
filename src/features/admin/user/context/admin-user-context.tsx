import React, { useState } from 'react'
import { AdminUser } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'

type AdminUserDialogType = 'add' | 'edit' | 'delete'

interface AdminUserContextType {
  open: AdminUserDialogType | null
  setOpen: (str: AdminUserDialogType | null) => void
  currentRow: AdminUser | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminUser | null>>
}

const AdminUserContext = React.createContext<AdminUserContextType | null>(null)

interface Props {
  readonly children: React.ReactNode
}

export default function AdminUserProvider({ children }: Props) {
  const [open, setOpen] = useState<AdminUserDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<AdminUser | null>(null)

  // 使用useMemo优化Context Provider的值
  const contextValue = React.useMemo(() => ({
    open,
    setOpen,
    currentRow,
    setCurrentRow
  }), [open, currentRow])

  return (
    <AdminUserContext.Provider value={contextValue}>
      {children}
    </AdminUserContext.Provider>
  )
}

export const useAdminUser = () => {
  const { t } = useTranslation()
  const ctx = React.useContext(AdminUserContext)
  if (!ctx) throw new Error(t('admin.user.context.error') || 'useAdminUser必须在AdminUserProvider中使用')
  return ctx
} 