/**
 * AI Configuration
 * 
 * 配置 AI Provider 和相关设置
 */

import { geminiText } from '@tanstack/ai-gemini'
import { openaiText } from '@tanstack/ai-openai'

export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'gemini',
  enabled: process.env.ENABLE_AI === 'true',
  model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
} as const

type Provider = 'openai' | 'gemini'

// Define adapters with their models - autocomplete works here!
const adapters = {
  openai: () => openaiText('gpt-5.2'),  // ✅ Autocomplete!
  gemini: () => geminiText('gemini-3-flash-preview')
}

/**
 * 获取配置的 AI Provider
 */
export function getAIAdapter(provider: Provider) {
  if (!AI_CONFIG.enabled) {
    throw new Error('AI features are disabled. Set ENABLE_AI=true in .env')
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required in .env')
  }

  return adapters[provider]
}
