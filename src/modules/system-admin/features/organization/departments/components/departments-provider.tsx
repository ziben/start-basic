import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import { type Department } from '../data/schema'

type DepartmentDialogType = 'create' | 'update' | 'delete'

type DepartmentsContextType = {
  open: DepartmentDialogType | null
  setOpen: (str: DepartmentDialogType | null) => void
  currentRow: Department | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Department | null>>
}

const DepartmentsContext = React.createContext<DepartmentsContextType | null>(null)

export function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const value = useDialogRowState<DepartmentDialogType, Department>()

  return <DepartmentsContext value={value}>{children}</DepartmentsContext>
}

export const useDepartments = () => {
  const departmentsContext = React.useContext(DepartmentsContext)

  if (!departmentsContext) {
    throw new Error('useDepartments has to be used within <DepartmentsProvider>')
  }

  return departmentsContext
}
