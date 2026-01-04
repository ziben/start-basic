import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRolesContext } from '../context/roles-context'

export function AdminRolesPrimaryButtons() {
    const { setOpen } = useRolesContext()
    return (
        <div className='flex gap-2'>
            <Button className='space-x-1' onClick={() => setOpen('create')}>
                <span>创建角色</span> <Plus size={18} />
            </Button>
        </div>
    )
}
