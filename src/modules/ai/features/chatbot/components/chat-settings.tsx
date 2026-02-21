import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings2 } from 'lucide-react'
import { useAIConfig } from '~/modules/ai/shared/hooks/use-ai-config'

export function ChatSettings() {
    const { config, setConfig } = useAIConfig()
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="AI 设置">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>AI 模型设定</SheetTitle>
                    <SheetDescription>
                        调整以下参数以改变 AI 的回复偏好。设置将自动保存在本地。
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-3">
                        <Label>对话模型 (Model)</Label>
                        <Select
                            value={config.modelProvider}
                            onValueChange={(val) => setConfig({ modelProvider: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择 AI 模型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gemini">Google Gemini</SelectItem>
                                <SelectItem value="openai">OpenAI (如已配置)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>想象力 (Temperature)</Label>
                            <span className="text-sm text-muted-foreground">{config.temperature}</span>
                        </div>
                        <Slider
                            value={[config.temperature]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={([val]) => setConfig({ temperature: val })}
                        />
                        <p className="text-xs text-muted-foreground">值越大生成的回复越具创造力；值越小回复越严谨保守。</p>
                    </div>

                    <div className="space-y-3">
                        <Label>系统设定 (System Prompt)</Label>
                        <Textarea
                            className="min-h-[150px]"
                            value={config.systemPrompt}
                            onChange={(e) => setConfig({ systemPrompt: e.target.value })}
                            placeholder="例如：你是一个有帮助的 AI 助手..."
                        />
                        <p className="text-xs text-muted-foreground">System Prompt 决定了 AI 的人设、语气及行为准则。更改后将在下次发送消息时生效。</p>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    )
}
