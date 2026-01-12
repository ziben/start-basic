import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRolesContext } from '../context/roles-context'

export function RolesPrimaryButtons() {
  const { openCreateDialog } = useRolesContext()

  return (
    <Button onClick={openCreateDialog}>
      <Plus className="mr-2 h-4 w-4" />
      新建角色
    </Button>
  )
}
