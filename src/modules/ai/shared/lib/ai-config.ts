/**
 * AI Configuration
 * 
 * 配置 AI Provider 和相关设置
 */

import { geminiText } from '@tanstack/ai-gemini'
import { openaiText } from '@tanstack/ai-openai'
import { getRuntimeConfig } from '~/shared/config/runtime-config'

export function getAIConfig() {
  return {
    provider: getRuntimeConfig('ai.provider'),
    enabled: getRuntimeConfig('ai.enabled'),
    model: getRuntimeConfig('ai.model'),
  }
}

type Provider = 'openai' | 'gemini'

/**
 * 获取基于配置的 AI Provider Adapter 实例工厂
 * 提供基础的配置提取、模型纠错及环境密钥鉴权
 */
export function getAIAdapter(provider: Provider = 'gemini') {
  const config = getAIConfig()

  if (config.enabled && String(config.enabled).toLowerCase() === 'false') {
    throw new Error('AI features are disabled. Set ENABLE_AI=true in .env')
  }

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required in server environment.')
    }
    const defaultModel = 'gemini-1.5-flash' // 使用官方最新模型名之一
    return () => geminiText((config.model as any) || defaultModel)
  }

  // 2. OpenAI Provider
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required in server environment.')
    }
    const defaultModel = 'gpt-4o' // 修正旧的非法型号
    return () => openaiText((config.model as any) || defaultModel)
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}
