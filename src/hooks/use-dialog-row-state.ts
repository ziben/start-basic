import { useMemo, useState } from 'react'
import useDialogState from './use-dialog-state'

export function useDialogRowState<TDialog extends string, TRow = unknown>() {
  const [open, setOpen] = useDialogState<TDialog>(null)
  const [currentRow, setCurrentRow] = useState<TRow | null>(null)

  return useMemo(
    () => ({
      open,
      setOpen,
      currentRow,
      setCurrentRow,
    }),
    [open, setOpen, currentRow, setCurrentRow]
  )
}
