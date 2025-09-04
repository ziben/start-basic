import { showSubmittedData } from '@/lib/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { NavGroupsImportDialog } from './navgroups-import-dialog'
import { NavGroupsMutateDrawer } from './navgroups-mutate-drawer'
import { useNavGroups } from './navgroups-provider'

export function NavGroupsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useNavGroups()
  return (
    <>
      <NavGroupsMutateDrawer
        key='navgroup-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <NavGroupsImportDialog
        key='navgroups-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <NavGroupsMutateDrawer
            key={`navgroup-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='navgroup-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
              showSubmittedData(
                currentRow,
                'The following navgroup has been deleted:'
              )
            }}
            className='max-w-md'
            title={`Delete this navgroup: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a navgroup with the ID{' '}
                <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}
    </>
  )
}
