import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDepartments } from './departments-provider'

export function DepartmentsPrimaryButtons() {
  const { setOpen } = useDepartments()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>创建部门</span> <Plus size={18} />
    </Button>
  )
}
