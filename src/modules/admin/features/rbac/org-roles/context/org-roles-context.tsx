import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import type { OrganizationRole, Role } from '@/generated/prisma/client'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTableUrlState } from '@/shared/hooks/use-table-url-state'

type OrgRoleWithRelations = OrganizationRole & {
  templateRole?: Role | null
  _count?: {
    permissions: number
    members: number
  }
}

type DialogState<T = any> = {
  isOpen: boolean
  data?: T
}

interface OrgRolesContextType {
  // 创建/编辑对话框
  mutateDialog: DialogState<OrgRoleWithRelations>
  openMutateDialog: (role?: OrgRoleWithRelations) => void
  closeMutateDialog: () => void

  // 删除对话框
  deleteDialog: DialogState<OrgRoleWithRelations>
  openDeleteDialog: (role: OrgRoleWithRelations) => void
  closeDeleteDialog: () => void

  // 权限分配对话框
  permissionsDialog: DialogState<OrgRoleWithRelations>
  openPermissionsDialog: (role: OrgRoleWithRelations) => void
  closePermissionsDialog: () => void

  tableUrl: ReturnType<typeof useTableUrlState>
}

const OrgRolesContext = createContext<OrgRolesContextType | undefined>(undefined)

export function OrgRolesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/admin/rbac/org-roles' })

  const tableUrl = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'organizationId', searchKey: 'organizationId', type: 'string' },
      { columnId: 'isActive', searchKey: 'isActive', type: 'array' },
    ],
  })

  const [mutateDialog, setMutateDialog] = useState<DialogState>({ isOpen: false })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ isOpen: false })
  const [permissionsDialog, setPermissionsDialog] = useState<DialogState>({ isOpen: false })

  const value = useMemo(() => ({
    mutateDialog,
    openMutateDialog: (role?: OrgRoleWithRelations) => setMutateDialog({ isOpen: true, data: role }),
    closeMutateDialog: () => setMutateDialog({ isOpen: false }),

    deleteDialog,
    openDeleteDialog: (role: OrgRoleWithRelations) => setDeleteDialog({ isOpen: true, data: role }),
    closeDeleteDialog: () => setDeleteDialog({ isOpen: false }),

    permissionsDialog,
    openPermissionsDialog: (role: OrgRoleWithRelations) => setPermissionsDialog({ isOpen: true, data: role }),
    closePermissionsDialog: () => setPermissionsDialog({ isOpen: false }),

    tableUrl,
  }), [mutateDialog, deleteDialog, permissionsDialog, tableUrl])

  return (
    <OrgRolesContext.Provider value={value}>
      {children}
    </OrgRolesContext.Provider>
  )
}

export const useOrgRolesContext = () => {
  const context = useContext(OrgRolesContext)
  if (!context) throw new Error('useOrgRolesContext must be used within OrgRolesProvider')
  return context
}
