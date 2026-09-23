import { useAIConfig } from '~/modules/ai/shared/hooks/use-ai-config'
import type { AIProvider } from '~/modules/ai/shared/hooks/use-ai-config'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'

type ProviderOption = {
  value: AIProvider
  label: string
  badge?: string
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'deepseek', label: 'DeepSeek', badge: '国产' },
  { value: 'qwen', label: '通义千问', badge: '国产' },
  { value: 'zhipu', label: '智谱 GLM', badge: '国产' },
  { value: 'ernie', label: '文心一言', badge: '国产' },
]

export function ChatSettingsPanel({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { config, setConfig } = useAIConfig()

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className='overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>AI 模型设定</SheetTitle>
          <SheetDescription>调整以下参数以改变 AI 的回复偏好。设置将自动保存在本地，下次发送时生效。</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 py-6'>
          <div className='space-y-3'>
            <Label>对话模型 Provider</Label>
            <Select
              value={config.modelProvider}
              onValueChange={(val) => setConfig({ modelProvider: val as AIProvider })}
            >
              <SelectTrigger>
                <SelectValue placeholder='选择 AI 服务商' />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className='flex items-center gap-2'>
                      {opt.label}
                      {opt.badge && (
                        <span className='rounded bg-primary/10 px-1 py-0.5 text-[10px] leading-none text-primary'>
                          {opt.badge}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>国产模型需在服务端 .env 中配置对应的 API Key 才能使用。</p>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>想象力（Temperature）</Label>
              <span className='font-mono text-sm text-muted-foreground tabular-nums'>
                {config.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[config.temperature]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={([val]) => setConfig({ temperature: val })}
            />
            <div className='flex justify-between text-[11px] text-muted-foreground'>
              <span>严谨保守（0）</span>
              <span>发散创意（2）</span>
            </div>
          </div>

          <Separator />

          <div className='space-y-3'>
            <Label>系统设定（System Prompt）</Label>
            <Textarea
              className='min-h-[150px] text-sm'
              value={config.systemPrompt}
              onChange={(e) => setConfig({ systemPrompt: e.target.value })}
              placeholder='例如：你是一个有帮助的 AI 助手...'
            />
            <p className='text-xs text-muted-foreground'>
              System Prompt 决定 AI 的人设、语气及行为准则。更改后将在下次发送时生效。
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
