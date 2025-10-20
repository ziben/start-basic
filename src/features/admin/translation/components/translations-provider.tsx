import React, { useState } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { Translation } from '~/generated/prisma/client'


type TranslationsDialogType = 'create' | 'update' | 'delete' | 'import'

type TranslationsContextType = {
  open: TranslationsDialogType | null
  setOpen: (str: TranslationsDialogType | null) => void
  currentRow: Translation | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Translation | null>>
}

const TranslationsContext = React.createContext<TranslationsContextType | null>(null)

export function TranslationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TranslationsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Translation | null>(null)

  return (
    <TranslationsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TranslationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslations = () => {
  const translationsContext = React.useContext(TranslationsContext)

  if (!translationsContext) {
    throw new Error('useTranslations has to be used within <TranslationsProvider>')
  }

  return translationsContext
}