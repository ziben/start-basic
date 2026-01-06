import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import { type Member } from '../data/schema'

type MemberDialogType = 'create' | 'update' | 'delete'

type MembersContextType = {
  open: MemberDialogType | null
  setOpen: (str: MemberDialogType | null) => void
  currentRow: Member | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Member | null>>
}

const MembersContext = React.createContext<MembersContextType | null>(null)

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const value = useDialogRowState<MemberDialogType, Member>()

  return <MembersContext value={value}>{children}</MembersContext>
}

export const useMembers = () => {
  const membersContext = React.useContext(MembersContext)

  if (!membersContext) {
    throw new Error('useMembers has to be used within <MembersProvider>')
  }

  return membersContext
}
