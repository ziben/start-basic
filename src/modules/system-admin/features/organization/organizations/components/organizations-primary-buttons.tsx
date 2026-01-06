import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganizations } from './organizations-provider'

export function OrganizationsPrimaryButtons() {
  const { setOpen } = useOrganizations()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>创建组织</span> <Plus size={18} />
    </Button>
  )
}
