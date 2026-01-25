import { createContext, useContext, useState, ReactNode } from 'react'
import type { Permission, Resource, Action } from '@/generated/prisma/client'

type PermissionWithRelations = Permission & {
  resource: Resource
  action: Action
}

type DialogState<T = any> = {
  isOpen: boolean
  data?: T
}

interface PermissionsContextType {
  // 资源对话框
  resourceDialog: DialogState<Resource>
  openResourceDialog: (resource?: Resource) => void
  closeResourceDialog: () => void

  // 操作对话框
  actionDialog: DialogState<{ action?: Action; resourceId: string }>
  openActionDialog: (resourceId: string, action?: Action) => void
  closeActionDialog: () => void

  // 权限对话框
  permissionDialog: DialogState<PermissionWithRelations>
  openPermissionDialog: (permission?: PermissionWithRelations) => void
  closePermissionDialog: () => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [resourceDialog, setResourceDialog] = useState<DialogState<Resource>>({ isOpen: false })
  const [actionDialog, setActionDialog] = useState<DialogState>({ isOpen: false })
  const [permissionDialog, setPermissionDialog] = useState<DialogState<PermissionWithRelations>>({ isOpen: false })

  const openResourceDialog = (resource?: Resource) => setResourceDialog({ isOpen: true, data: resource })
  const closeResourceDialog = () => setResourceDialog({ isOpen: false })

  const openActionDialog = (resourceId: string, action?: Action) => 
    setActionDialog({ isOpen: true, data: { resourceId, action } })
  const closeActionDialog = () => setActionDialog({ isOpen: false })

  const openPermissionDialog = (permission?: PermissionWithRelations) => 
    setPermissionDialog({ isOpen: true, data: permission })
  const closePermissionDialog = () => setPermissionDialog({ isOpen: false })

  return (
    <PermissionsContext.Provider
      value={{
        resourceDialog,
        openResourceDialog,
        closeResourceDialog,
        actionDialog,
        openActionDialog,
        closeActionDialog,
        permissionDialog,
        openPermissionDialog,
        closePermissionDialog,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext)
  if (!context) throw new Error('usePermissionsContext must be used within PermissionsProvider')
  return context
}
