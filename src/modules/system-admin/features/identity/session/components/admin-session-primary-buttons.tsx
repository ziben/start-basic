import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface AdminSessionPrimaryButtonsProps {
    selectedCount: number
    isMutating: boolean
    onBulkDelete: () => void
}

export function AdminSessionPrimaryButtons({
    selectedCount,
    isMutating,
    onBulkDelete,
}: AdminSessionPrimaryButtonsProps) {
    return (
        <div className='flex items-center gap-2'>
            <Button
                variant='destructive'
                size='sm'
                disabled={selectedCount === 0 || isMutating}
                onClick={onBulkDelete}
            >
                <Trash2 className='mr-2 h-4 w-4' />
                批量撤销
                {selectedCount > 0 ? (
                    <span className='ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs'>{selectedCount}</span>
                ) : null}
            </Button>
        </div>
    )
}
