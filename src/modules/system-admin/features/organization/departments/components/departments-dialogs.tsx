import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteDepartmentFn } from '../../../../shared/server-fns/department.fn'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DEPARTMENTS_QUERY_KEY } from '../hooks/use-departments-query'
import { useDepartmentsOptimisticUpdate } from '../hooks/use-departments-optimistic-update'
import { DepartmentMutateDialog } from './department-mutate-dialog'
import { useDepartments } from './departments-provider'
import { type Department } from '../data/schema'

type DepartmentsDialogsProps = {
  organizationId: string
  departments: Department[]
}

export function DepartmentsDialogs({ organizationId, departments }: DepartmentsDialogsProps) {
  const { open, setOpen, currentRow, setCurrentRow } = useDepartments()
  const { getOptimisticMutationOptions } = useDepartmentsOptimisticUpdate()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await deleteDepartmentFn({ data: { id: input.id } })
    },
    ...getOptimisticMutationOptions({
      queryKey: DEPARTMENTS_QUERY_KEY,
      updateFn: (depts, variables) => depts.filter((d) => d.id !== variables.id),
    }),
  })

  useEffect(() => {
    if (!open) {
      setCurrentRow(null)
    }
  }, [open, setCurrentRow])

  return (
    <>
      <DepartmentMutateDialog
        key='department-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        organizationId={organizationId}
        departments={departments}
      />

      {currentRow && (
        <>
          <DepartmentMutateDialog
            key={`department-edit-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => setOpen('update')}
            currentRow={currentRow}
            organizationId={organizationId}
            departments={departments}
          />

          <ConfirmDialog
            key={`department-delete-${currentRow.id}`}
            destructive
            open={open === 'delete'}
            onOpenChange={() => setOpen('delete')}
            handleConfirm={() => {
              const id = currentRow.id
              setOpen(null)

              const promise = deleteOneMutation.mutateAsync({ id })
              toast.promise(promise, {
                loading: '删除中...',
                success: () => `已删除部门 ${currentRow.name}`,
                error: String,
              })
            }}
            className='max-w-md'
            title={`删除部门: ${currentRow.name}?`}
            desc={
              <>
                确定要删除部门 <strong>{currentRow.name}</strong> 吗？
                <br />
                {currentRow.children && currentRow.children.length > 0 && (
                  <>
                    <span className='text-destructive font-semibold'>
                      警告：该部门下有 {currentRow.children.length} 个子部门，删除后子部门也将被删除。
                    </span>
                    <br />
                  </>
                )}
                此操作无法撤销。
              </>
            }
            confirmText='删除'
          />
        </>
      )}
    </>
  )
}
