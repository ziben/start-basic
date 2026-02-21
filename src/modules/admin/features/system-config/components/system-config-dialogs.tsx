import { type ReactElement } from 'react'
import { useSystemConfigContext } from './system-config-provider'
import { SystemConfigCreateDialog } from './system-config-create-dialog'
import { SystemConfigDeleteDialog } from './system-config-delete-dialog'
import { SystemConfigEditDialog } from './system-config-edit-dialog'
import { SystemConfigHistoryDialog } from './system-config-history-dialog'

export function SystemConfigDialogs(): ReactElement {
  const { open, setOpen, currentRow } = useSystemConfigContext()

  return (
    <>
      <SystemConfigCreateDialog
        open={open === 'create'}
        onClose={() => setOpen(null)}
      />

      {currentRow && (
        <SystemConfigEditDialog
          key={`edit-${currentRow.id}-${open === 'edit'}`} // 强制重新挂载以重置状态
          row={currentRow}
          open={open === 'edit'}
          onClose={() => setOpen(null)}
        />
      )}

      {currentRow && (
        <SystemConfigDeleteDialog
          row={currentRow}
          open={open === 'delete'}
          onClose={() => setOpen(null)}
        />
      )}

      {currentRow && (
        <SystemConfigHistoryDialog
          key={`history-${currentRow.id}-${open === 'history'}`}
          row={currentRow}
          open={open === 'history'}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}
