import React from 'react'
import { useDialogRowState } from '@/shared/hooks/use-dialog-row-state'
import type { Translation } from '~/modules/admin/features/i18n/translation/types/translation'

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

export const useTranslations = () => {
  const translationsContext = React.useContext(TranslationsContext)

  if (!translationsContext) {
    throw new Error('useTranslations has to be used within <TranslationsProvider>')
  }

  return translationsContext
}
