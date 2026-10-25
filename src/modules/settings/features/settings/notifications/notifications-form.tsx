import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

export function NotificationsForm(): React.ReactElement {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-2'>
        <Badge variant='outline'>未开放</Badge>
        <p className='text-sm text-muted-foreground'>通知设置暂未接入保存，以下为当前支持的选项预览。</p>
      </div>

      <div className='space-y-3'>
        <Label>通知类型</Label>
        <RadioGroup defaultValue='all' disabled className='grid gap-2'>
          {[
            { value: 'all', label: '所有新消息' },
            { value: 'mentions', label: '仅提及我的消息' },
            { value: 'none', label: '不接收通知' },
          ].map((item) => (
            <div key={item.value} className='flex items-center space-x-2'>
              <RadioGroupItem value={item.value} id={item.value} />
              <Label htmlFor={item.value}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className='space-y-3'>
        {[
          { id: 'security', label: '安全邮件', defaultChecked: true, description: '账号安全相关邮件' },
          { id: 'commun', label: '通信邮件', defaultChecked: false, description: '产品通信与公告' },
          { id: 'social', label: '社交邮件', defaultChecked: true, description: '互动与社交提醒' },
          { id: 'marketing', label: '营销邮件', defaultChecked: false, description: '活动与推广信息' },
        ].map((item) => (
          <div key={item.id} className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <Label>{item.label}</Label>
              <p className='text-sm text-muted-foreground'>{item.description}</p>
            </div>
            {item.id === 'security' ? (
              <Checkbox checked disabled />
            ) : (
              <Switch checked={item.defaultChecked} disabled />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
