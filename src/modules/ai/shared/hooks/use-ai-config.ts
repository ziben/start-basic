/**
 * useAIConfig
 *
 * AI 配置的全局状态 Hook。
 *
 * 【修复说明】
 * 原先使用 useState + localStorage 的方式，每次调用 useAIConfig() 都会创建独立的 React state 实例。
 * 导致 ChatSettings 更新 provider 后，ChatInterface 里的 useChat 完全感知不到变化。
 *
 * 现在改用 useSyncExternalStore + 模块级 store，所有调用方共享同一份数据，
 * 任意一处 setConfig 都会同步通知全部订阅者重新渲染。
 */

import { useSyncExternalStore } from 'react'
import type { AIProvider } from '../lib/ai-config'

export type { AIProvider }

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface AIConfig {
    systemPrompt: string
    temperature: number
    modelProvider: AIProvider
}

// ─── 默认值 ───────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AIConfig = {
    systemPrompt: '你是一个有帮助的 AI 助手，可以解答各类问题并在必要时使用中文进行回复。',
    temperature: 0.7,
    modelProvider: 'gemini',
}

const CONFIG_KEY = 'ai_user_config'

// ─── 模块级全局 Store ─────────────────────────────────────────────────────────

function readFromStorage(): AIConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG
    try {
        const stored = localStorage.getItem(CONFIG_KEY)
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
    } catch {
        // ignore
    }
    return DEFAULT_CONFIG
}

/**
 * 简单的 pub/sub store，实现跨组件共享状态。
 * 不依赖任何第三方状态库，只使用 React 18 的 useSyncExternalStore。
 */
const store = {
    value: readFromStorage(),
    listeners: new Set<() => void>(),

    getSnapshot(): AIConfig {
        return store.value
    },

    getServerSnapshot(): AIConfig {
        return DEFAULT_CONFIG
    },

    subscribe(listener: () => void): () => void {
        store.listeners.add(listener)
        return () => store.listeners.delete(listener)
    },

    update(patch: Partial<AIConfig>): void {
        store.value = { ...store.value, ...patch }
        // 持久化
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(store.value))
        } catch {
            // ignore（e.g. Safari 隐私模式）
        }
        // 通知所有订阅者重新渲染
        store.listeners.forEach((l) => l())
    },
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAIConfig() {
    const config = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot,
    )

    const setConfig = (newConfig: Partial<AIConfig>) => {
        store.update(newConfig)
    }

    return { config, setConfig }
}
