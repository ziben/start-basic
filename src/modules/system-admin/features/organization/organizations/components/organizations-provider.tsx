import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import { type Organization } from '../data/schema'

type OrganizationDialogType = 'create' | 'update' | 'delete'

type OrganizationsContextType = {
  open: OrganizationDialogType | null
  setOpen: (str: OrganizationDialogType | null) => void
  currentRow: Organization | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Organization | null>>
}

const OrganizationsContext = React.createContext<OrganizationsContextType | null>(null)

export function OrganizationsProvider({ children }: { children: React.ReactNode }) {
  const value = useDialogRowState<OrganizationDialogType, Organization>()

  return <OrganizationsContext value={value}>{children}</OrganizationsContext>
}

export const useOrganizations = () => {
  const organizationsContext = React.useContext(OrganizationsContext)

  if (!organizationsContext) {
    throw new Error('useOrganizations has to be used within <OrganizationsProvider>')
  }

  return organizationsContext
}
