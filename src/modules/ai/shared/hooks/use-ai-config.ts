import { useState, useEffect } from 'react'

export interface AIConfig {
    systemPrompt: string;
    temperature: number;
    modelProvider: string;
}

const DEFAULT_CONFIG: AIConfig = {
    systemPrompt: '你是一个有帮助的 AI 助手，可以解答各类问题并在必要时使用中文进行回复。',
    temperature: 0.7,
    modelProvider: 'gemini',
}

const CONFIG_KEY = 'ai_user_config'

export function useAIConfig() {
    const [config, setConfigState] = useState<AIConfig>(DEFAULT_CONFIG)

    useEffect(() => {
        const stored = localStorage.getItem(CONFIG_KEY)
        if (stored) {
            try {
                setConfigState({ ...DEFAULT_CONFIG, ...JSON.parse(stored) })
            } catch (e) {
                console.error('Failed to parse AI config', e)
            }
        }
    }, [])

    const setConfig = (newConfig: Partial<AIConfig>) => {
        const next = { ...config, ...newConfig }
        setConfigState(next)
        localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
    }

    return { config, setConfig }
}
