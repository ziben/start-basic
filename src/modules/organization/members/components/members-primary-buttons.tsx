import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMembers } from './members-provider'

export function MembersPrimaryButtons() {
  const { setOpen } = useMembers()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>添加成员</span> <Plus size={18} />
    </Button>
  )
}
