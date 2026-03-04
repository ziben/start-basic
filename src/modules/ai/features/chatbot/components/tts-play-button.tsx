/**
 * TTS 朗读按钮 - 通用组件示例
 *
 * 在禅卡解读场景中的使用示例：
 *
 * ```tsx
 * // 禅卡项目中调用
 * <TTSPlayButton messageId={aiMessage.id} />
 *
 * // 或使用完整控制版
 * const { isLoading, isPlaying, play, stop, preload } = useTTSPlayer(messageId)
 *
 * // 在 AI 流结束时提前预热（实现近似秒播）：
 * useEffect(() => {
 *   if (isStreamDone && messageId) preload()
 * }, [isStreamDone, messageId])
 * ```
 */
import { Square, Volume2, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/shared/lib/utils'
import { useTTSPlayer } from '~/shared/hooks/use-tts-player'

interface TTSPlayButtonProps {
    /** AI 消息的数据库 ID */
    messageId: string | null | undefined
    /** 额外 class */
    className?: string
    /** 按钮 variant，默认 ghost */
    variant?: 'ghost' | 'outline' | 'default'
}

/**
 * 朗读按钮
 * - idle    → 点击后加载并播放
 * - loading → 显示 loading spinner
 * - playing → 点击停止
 * - error   → 提示错误，可重试
 */
export function TTSPlayButton({
    messageId,
    className,
    variant = 'ghost',
}: TTSPlayButtonProps) {
    const { isLoading, isPlaying, error, play, stop } = useTTSPlayer(messageId)

    const handleClick = () => {
        if (isPlaying) {
            stop()
        } else {
            play()
        }
    }

    const icon = isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
    ) : isPlaying ? (
        <Square className="h-4 w-4" />
    ) : (
        <Volume2 className="h-4 w-4" />
    )

    const label = isLoading ? '生成中...' : isPlaying ? '停止' : '朗读'

    return (
        <Button
            variant={variant}
            size="sm"
            disabled={isLoading || !messageId}
            onClick={handleClick}
            title={error ?? label}
            className={cn(
                'gap-1.5 text-xs',
                isPlaying && 'text-primary',
                error && 'text-destructive',
                className,
            )}
        >
            {icon}
            <span>{label}</span>
        </Button>
    )
}
