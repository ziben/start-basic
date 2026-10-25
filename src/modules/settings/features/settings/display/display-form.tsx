import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function DisplayForm(): React.ReactElement {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-2'>
        <Badge variant='outline'>未开放</Badge>
        <p className='text-sm text-muted-foreground'>显示偏好暂未接入保存，以下为当前支持的选项预览。</p>
      </div>

      <div className='space-y-3'>
        <Label className='text-base'>侧边栏</Label>
        <p className='text-sm text-muted-foreground'>选择希望显示在侧边栏中的项目。</p>
        {[
          { id: 'recents', label: '最近访问', checked: true },
          { id: 'home', label: '首页', checked: true },
          { id: 'applications', label: '应用', checked: false },
          { id: 'desktop', label: '桌面', checked: false },
          { id: 'downloads', label: '下载', checked: false },
          { id: 'documents', label: '文档', checked: false },
        ].map((item) => (
          <div key={item.id} className='flex flex-row items-start'>
            <Checkbox id={item.id} checked={item.checked} disabled className='mt-1' />
            <Label htmlFor={item.id} className='ml-2 font-normal'>
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
