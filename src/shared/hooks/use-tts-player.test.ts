import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTTSPlayer } from './use-tts-player'

class MockAudio {
    static instances: MockAudio[] = []

    src = ''
    preload = 'none'
    currentTime = 0
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    pause = vi.fn()
    play = vi.fn().mockResolvedValue(undefined)

    constructor(url?: string) {
        if (url) this.src = url
        MockAudio.instances.push(this)
    }
}

describe('useTTSPlayer', () => {
    beforeEach(() => {
        MockAudio.instances = []
        vi.stubGlobal('Audio', MockAudio)
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: true,
                    audioUrl: 'https://cdn.example.com/audio.mp3',
                    cached: true,
                }),
            }),
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('deduplicates preload requests for the same message', async () => {
        const { result } = renderHook(() => useTTSPlayer('msg-1'))

        await act(async () => {
            await Promise.all([result.current.preload(), result.current.preload()])
        })

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(MockAudio.instances).toHaveLength(1)
        expect(MockAudio.instances[0]?.preload).toBe('auto')
    })

    it('reuses the preloaded audio instance when playback starts', async () => {
        const { result } = renderHook(() => useTTSPlayer('msg-1'))

        await act(async () => {
            await result.current.preload()
        })

        const audio = MockAudio.instances[0]

        await act(async () => {
            await result.current.play()
        })

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(MockAudio.instances).toHaveLength(1)
        expect(audio?.play).toHaveBeenCalledTimes(1)
        await waitFor(() => {
            expect(result.current.isPlaying).toBe(true)
        })
    })

    it('resets state when the message changes', async () => {
        const { result, rerender } = renderHook(
            ({ messageId }) => useTTSPlayer(messageId),
            { initialProps: { messageId: 'msg-1' as string | null } },
        )

        await act(async () => {
            await result.current.play()
        })

        const firstAudio = MockAudio.instances[0]

        rerender({ messageId: 'msg-2' })

        await waitFor(() => {
            expect(result.current.state).toBe('idle')
            expect(result.current.error).toBeNull()
        })
        expect(firstAudio?.pause).toHaveBeenCalled()
    })
})
