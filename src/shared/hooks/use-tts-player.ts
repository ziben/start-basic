/**
 * useTTSPlayer Hook
 *
 * 通用的 AI 消息朗读 Hook，适用于 Web 端和微信小程序 H5 端。
 *
 * 功能：
 * - 通过 messageId 向 /api/tts 发请求获取音频 URL
 * - 管理播放/暂停/停止状态
 * - AI 回复流结束后支持「提前预加载」，用户点击时实现近似秒播
 * - 自动清理 Audio 实例，防止内存泄漏
 *
 * 用法：
 * ```tsx
 * const { isLoading, isPlaying, play, stop } = useTTSPlayer(messageId)
 *
 * <Button onClick={isPlaying ? stop : play}>
 *   {isLoading ? '生成中...' : isPlaying ? '停止' : '朗读'}
 * </Button>
 * ```
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface TTSApiResponse {
    success: boolean
    audioUrl: string
    cached: boolean
    error?: string
}

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface UseTTSPlayerReturn {
    /** 当前播放状态 */
    state: PlayState
    /** 是否正在加载（请求接口中） */
    isLoading: boolean
    /** 是否正在播放 */
    isPlaying: boolean
    /** 错误信息 */
    error: string | null
    /** 开始播放（若已有缓存则直接播） */
    play: () => Promise<void>
    /** 停止播放并重置进度 */
    stop: () => void
    /** 暂停播放 */
    pause: () => void
    /**
     * 提前预加载音频（建议在 AI 回复流结束时调用）
     * 用户点击播放时可实现近似秒播
     */
    preload: () => Promise<void>
}

// ─── Hook 实现 ────────────────────────────────────────────────────────────────

/**
 * @param messageId AI 消息的数据库 ID，为 null/undefined 时 Hook 处于未激活状态
 */
export function useTTSPlayer(messageId: string | null | undefined): UseTTSPlayerReturn {
    const [state, setState] = useState<PlayState>('idle')
    const [error, setError] = useState<string | null>(null)

    // 已解析的音频 URL（缓存用，避免重复请求接口）
    const resolvedUrlRef = useRef<string | null>(null)
    // Native Audio 实例
    const audioRef = useRef<HTMLAudioElement | null>(null)
    // 组件卸载标志，防止异步回调操作已卸载的组件
    const unmountedRef = useRef(false)

    // ── 清理 Audio 实例 ──────────────────────────────────────────────────────
    const destroyAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
            audioRef.current.onended = null
            audioRef.current.onerror = null
            audioRef.current = null
        }
    }, [])

    // ── 组件 unmount 时清理 ──────────────────────────────────────────────────
    useEffect(() => {
        unmountedRef.current = false
        return () => {
            unmountedRef.current = true
            destroyAudio()
        }
    }, [destroyAudio])

    // ── messageId 变化时重置状态（切换到不同消息） ───────────────────────────
    useEffect(() => {
        destroyAudio()
        resolvedUrlRef.current = null
        setState('idle')
        setError(null)
    }, [messageId, destroyAudio])

    // ── 获取音频 URL（含接口请求和缓存） ────────────────────────────────────
    const getAudioUrl = useCallback(async (): Promise<string> => {
        // 已有缓存 URL，直接复用
        if (resolvedUrlRef.current) return resolvedUrlRef.current

        if (!messageId) throw new Error('messageId 不能为空')

        const res = await fetch(`/api/tts?messageId=${encodeURIComponent(messageId)}`)
        const data: TTSApiResponse = await res.json()

        if (!res.ok || !data.success) {
            throw new Error(data.error ?? '获取音频失败')
        }

        resolvedUrlRef.current = data.audioUrl
        return data.audioUrl
    }, [messageId])

    // ── 创建并配置 Audio 实例 ────────────────────────────────────────────────
    const createAudio = useCallback((url: string): HTMLAudioElement => {
        destroyAudio()
        const audio = new Audio(url)

        audio.onended = () => {
            if (!unmountedRef.current) setState('idle')
        }

        audio.onerror = () => {
            if (!unmountedRef.current) {
                setState('error')
                setError('音频播放失败，请重试')
            }
        }

        audioRef.current = audio
        return audio
    }, [destroyAudio])

    // ── play ─────────────────────────────────────────────────────────────────
    const play = useCallback(async () => {
        if (!messageId) return

        try {
            setError(null)
            setState('loading')

            const url = await getAudioUrl()
            if (unmountedRef.current) return

            // 如果已有 Audio 实例（preload 过），直接播；否则新建
            const audio = audioRef.current?.src ? audioRef.current : createAudio(url)
            if (!audioRef.current?.src) {
                // 刚创建的实例没有 src，重新赋值
                createAudio(url)
            }

            audioRef.current!.src = url
            await audioRef.current!.play()

            if (!unmountedRef.current) setState('playing')
        } catch (err) {
            if (!unmountedRef.current) {
                const msg = err instanceof Error ? err.message : '播放失败'
                setError(msg)
                setState('error')
            }
        }
    }, [messageId, getAudioUrl, createAudio])

    // ── stop ─────────────────────────────────────────────────────────────────
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        setState('idle')
    }, [])

    // ── pause ────────────────────────────────────────────────────────────────
    const pause = useCallback(() => {
        if (audioRef.current && state === 'playing') {
            audioRef.current.pause()
            setState('paused')
        }
    }, [state])

    // ── preload（提前预热，建议在 AI 回复流结束时调用） ──────────────────────
    const preload = useCallback(async () => {
        if (!messageId || resolvedUrlRef.current) return
        try {
            const url = await getAudioUrl()
            if (unmountedRef.current) return
            // 预创建 Audio 实例以触发浏览器预缓冲
            const audio = createAudio(url)
            audio.preload = 'auto'
        } catch {
            // preload 失败静默处理，不影响主流程
        }
    }, [messageId, getAudioUrl, createAudio])

    return {
        state,
        isLoading: state === 'loading',
        isPlaying: state === 'playing',
        error,
        play,
        stop,
        pause,
        preload,
    }
}
