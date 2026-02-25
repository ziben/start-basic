/**
 * AI Configuration
 *
 * 配置 AI Provider 和相关设置
 * 支持 Google Gemini、OpenAI 以及兼容 OpenAI API 的国产大模型
 */

import { geminiText } from '@tanstack/ai-gemini'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { getRuntimeConfig } from '~/shared/config/runtime-config'

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'ernie'

export function getAIConfig() {
  return {
    provider: getRuntimeConfig('ai.provider'),
    enabled: getRuntimeConfig('ai.enabled'),
    model: getRuntimeConfig('ai.model'),
  }
}

/**
 * 国产大模型服务商配置
 *
 * 接口兼容情况（@tanstack/ai-openai 使用 OpenAI Responses API）：
 *   - qwen：支持 Responses API，使用 defaultBaseURL 即可
 *   - deepseek / zhipu / ernie：仅支持 Chat Completions API（暂不兼容，待确认）
 *
 * 如需覆盖 baseURL（接入代理/私有部署），设置对应的 XXXX_BASE_URL 环境变量。
 */
const CHINA_PROVIDERS: Record<
  'deepseek' | 'qwen' | 'zhipu' | 'ernie',
  {
    /** 官方默认 baseURL，可通过 baseURLEnvKey 对应的环境变量覆盖 */
    defaultBaseURL: string
    /** 读取自定义 baseURL 的环境变量名（用于接入代理或私有部署） */
    baseURLEnvKey: string
    /** 读取 API Key 的环境变量名 */
    envKey: string
    defaultModel: string
    description: string
  }
> = {
  deepseek: {
    defaultBaseURL: 'https://api.deepseek.com/v1',
    baseURLEnvKey: 'DEEPSEEK_BASE_URL',
    envKey: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
    description: 'DeepSeek（深度求索）',
  },
  qwen: {
    // 此地址兼容 OpenAI Responses API，与 @tanstack/ai-openai 直接适配
    defaultBaseURL: 'https://dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode/v1',
    baseURLEnvKey: 'QWEN_BASE_URL',
    envKey: 'QWEN_API_KEY',
    defaultModel: 'qwen-plus',
    description: '通义千问（阿里云 DashScope）',
  },
  zhipu: {
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
    baseURLEnvKey: 'ZHIPU_BASE_URL',
    envKey: 'ZHIPU_API_KEY',
    defaultModel: 'glm-4-flash',
    description: '智谱 GLM（智谱 AI）',
  },
  ernie: {
    defaultBaseURL: 'https://qianfan.baidubce.com/v2',
    baseURLEnvKey: 'ERNIE_BASE_URL',
    envKey: 'ERNIE_API_KEY',
    defaultModel: 'ernie-4.5-8k',
    description: '文心一言（百度千帆）',
  },
}

/**
 * Provider 对应的模型环境变量
 * 优先级：环境变量 > CHINA_PROVIDERS 默认值 > ai.model 配置
 */
const PROVIDER_MODEL_ENV: Partial<Record<AIProvider, string>> = {
  deepseek: process.env.DEEPSEEK_MODEL,
  qwen: process.env.QWEN_MODEL,
  zhipu: process.env.ZHIPU_MODEL,
  ernie: process.env.ERNIE_MODEL,
}

/**
 * 获取基于配置的 AI Provider Adapter 实例工厂
 * 提供基础的配置提取、模型纠错及环境密钥鉴权
 */
export function getAIAdapter(provider?: AIProvider) {
  const config = getAIConfig()

  if (config.enabled && String(config.enabled).toLowerCase() === 'false') {
    throw new Error('AI features are disabled. Set ENABLE_AI=true in .env')
  }

  const resolvedProvider: AIProvider = provider ?? (config.provider as AIProvider) ?? 'gemini'

  // 1. Google Gemini Provider
  if (resolvedProvider === 'gemini') {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required in server environment.')
    }
    const defaultModel = 'gemini-1.5-flash'
    const model = (config.model as string) || defaultModel
    return () => geminiText(model as any)
  }

  // 2. OpenAI Provider（原生，支持 OPENAI_BASE_URL 覆盖以接入代理）
  if (resolvedProvider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required in server environment.')
    }
    const defaultModel = 'gpt-4o'
    const model = (config.model as string) || defaultModel
    const baseURL = process.env.OPENAI_BASE_URL || undefined
    return () => createOpenaiChat(model as any, apiKey, { baseURL })
  }

  // 3. 国产大模型（兼容 OpenAI API）
  if (resolvedProvider in CHINA_PROVIDERS) {
    const providerConfig = CHINA_PROVIDERS[resolvedProvider as keyof typeof CHINA_PROVIDERS]
    const apiKey = process.env[providerConfig.envKey]

    if (!apiKey) {
      throw new Error(
        `${providerConfig.envKey} is required for ${providerConfig.description}. ` +
        `Please set it in your .env file.`,
      )
    }

    // baseURL 优先级：自定义 env 变量 > 代码内置官方默认值
    // 通过 XXXX_BASE_URL 可接入国内代理、私有部署的兼容接口
    const baseURL = process.env[providerConfig.baseURLEnvKey] || providerConfig.defaultBaseURL

    // 模型优先级：provider 专属 env 变量 > 全局 ai.model 配置 > provider 默认值
    const model =
      PROVIDER_MODEL_ENV[resolvedProvider] ||
      (config.model as string) ||
      providerConfig.defaultModel

    return () =>
      createOpenaiChat(model as any, apiKey, {
        baseURL,
        dangerouslyAllowBrowser: false,
      })
  }

  throw new Error(`Unsupported AI provider: ${resolvedProvider}`)
}
