import React from 'react'
import { Translation } from '~/generated/prisma/client'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'

type TranslationsDialogType = 'create' | 'update' | 'delete' | 'import'

type TranslationsContextType = {
  open: TranslationsDialogType | null
  setOpen: (str: TranslationsDialogType | null) => void
  currentRow: Translation | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Translation | null>>
}

const TranslationsContext = React.createContext<TranslationsContextType | null>(null)

export function TranslationsProvider({ children }: { children: React.ReactNode }) {
  const value = useDialogRowState<TranslationsDialogType, Translation>()

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslations = () => {
  const translationsContext = React.useContext(TranslationsContext)

  if (!translationsContext) {
    throw new Error('useTranslations has to be used within <TranslationsProvider>')
  }

  return translationsContext
}


