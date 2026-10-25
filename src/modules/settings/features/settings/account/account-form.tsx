import { Link } from '@tanstack/react-router'
import { useAuth } from '@/shared/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountForm(): React.ReactElement {
  const { user } = useAuth()

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <Label>显示名称</Label>
        <Input value={user?.name ?? ''} readOnly aria-readonly className='max-w-md' />
        <p className='text-sm text-muted-foreground'>
          显示名称在个人资料页维护。
          <Button asChild variant='link' size='sm' className='h-auto p-0 ml-1'>
            <Link to='/settings'>前往修改</Link>
          </Button>
        </p>
      </div>

      <div className='space-y-2'>
        <Label>出生日期</Label>
        <div className='flex items-center gap-2'>
          <Input value='' readOnly disabled placeholder='—' className='max-w-md' />
          <Badge variant='outline'>未开放</Badge>
        </div>
        <p className='text-sm text-muted-foreground'>出生日期设置暂未接入保存。</p>
      </div>

      <div className='space-y-2'>
        <Label>语言</Label>
        <div className='flex items-center gap-2'>
          <Input value='' readOnly disabled placeholder='—' className='max-w-md' />
          <Badge variant='outline'>未开放</Badge>
        </div>
        <p className='text-sm text-muted-foreground'>界面语言设置暂未接入保存。</p>
      </div>
    </div>
  )
}
