import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type AdminNavgroup } from '../data/schema'

type NavGroupsDialogType = 'create' | 'update' | 'delete' | 'import'

type NavGroupsContextType = {
  open: NavGroupsDialogType | null
  setOpen: (str: NavGroupsDialogType | null) => void
  currentRow: AdminNavgroup | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminNavgroup | null>>
}

const NavGroupsContext = React.createContext<NavGroupsContextType | null>(null)

export function NavGroupsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<NavGroupsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<AdminNavgroup | null>(null)

  return (
    <NavGroupsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </NavGroupsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNavGroups = () => {
  const navGroupsContext = React.useContext(NavGroupsContext)

  if (!navGroupsContext) {
    throw new Error('useNavGroups has to be used within <NavGroupsContext>')
  }

  return navGroupsContext
}
