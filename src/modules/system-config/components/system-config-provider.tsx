import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import type { SystemConfig } from '../data/schema'

export type SystemConfigDialogType = 'create' | 'edit' | 'delete' | 'history'

type SystemConfigContextType = {
  open: SystemConfigDialogType | null
  setOpen: (value: SystemConfigDialogType | null) => void
  currentRow: SystemConfig | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SystemConfig | null>>
}

const SystemConfigContext = React.createContext<SystemConfigContextType | null>(null)

export function SystemConfigProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const value = useDialogRowState<SystemConfigDialogType, SystemConfig>()
  return <SystemConfigContext.Provider value={value}>{children}</SystemConfigContext.Provider>
}

export function useSystemConfigContext(): SystemConfigContextType {
  const context = React.useContext(SystemConfigContext)
  if (!context) {
    throw new Error('useSystemConfigContext must be used within <SystemConfigProvider>')
  }
  return context
}
