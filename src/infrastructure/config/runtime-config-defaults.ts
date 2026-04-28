export type RuntimeConfigShape = {
  'log.requestBody.enabled': boolean
  'log.dir': string
  'log.system.sampleRate': number
  'log.system.sampleLevels': string[]
  'log.maxBodyBytes': number
  'ai.enabled': boolean
  'ai.provider': 'gemini' | 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'ernie'
  'ai.model': string
  'ai.systemPrompt': string
  'auth.trustedOrigins': string[]
  'tts.enabled': boolean
  'tts.model': string
  'tts.voice': string
  'tts.format': 'mp3' | 'wav' | 'pcm'
  'tts.sampleRate': number
  'tts.speed': number
  'tts.enableInstruct': boolean
  'tts.instructPrefix': string
}

export type RuntimeConfigKey = keyof RuntimeConfigShape

const VALID_PROVIDERS = ['gemini', 'openai', 'deepseek', 'qwen', 'zhipu', 'ernie'] as const

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback
  return value === 'true'
}

function parseNumber(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseStringArray(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function buildRuntimeConfigDefaults(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfigShape {
  const rawProvider = env.AI_PROVIDER ?? 'gemini'
  const provider = (VALID_PROVIDERS as readonly string[]).includes(rawProvider)
    ? (rawProvider as RuntimeConfigShape['ai.provider'])
    : 'gemini'

  return {
    'log.requestBody.enabled': parseBoolean(env.LOG_REQUEST_BODY, false),
    'log.dir': env.LOG_DIR || 'logs',
    'log.system.sampleRate': parseNumber(env.SYSTEM_LOG_SAMPLE_RATE, 1),
    'log.system.sampleLevels': parseStringArray(env.SYSTEM_LOG_SAMPLE_LEVELS, ['info']),
    'log.maxBodyBytes': parseNumber(env.LOG_MAX_BODY_BYTES, 8 * 1024),
    'ai.enabled': parseBoolean(env.ENABLE_AI, false),
    'ai.provider': provider,
    'ai.model': env.GEMINI_MODEL || 'gemini-3-flash-preview',
    'ai.systemPrompt':
      env.AI_SYSTEM_PROMPT ||
      '你是一个有帮助的 AI 助手，可以解答各类问题并在必要时使用中文进行回复。',
    'auth.trustedOrigins': parseStringArray(env.BETTER_AUTH_TRUSTED_ORIGINS, []),
    'tts.enabled': parseBoolean(env.ENABLE_TTS, false),
    'tts.model': env.TTS_MODEL || 'qwen3-tts-instruct-flash',
    'tts.voice': env.TTS_VOICE || 'Serena',
    'tts.format': (env.TTS_FORMAT || 'mp3') as RuntimeConfigShape['tts.format'],
    'tts.sampleRate': parseNumber(env.TTS_SAMPLE_RATE, 16000),
    'tts.speed': parseNumber(env.TTS_SPEED, 1.0),
    'tts.enableInstruct': env.TTS_ENABLE_INSTRUCT !== 'false',
    'tts.instructPrefix':
      env.TTS_INSTRUCT_PREFIX ||
      '语速偏慢，音调温柔平静，语气治愈温暖，像一位智者在娓娓道来。',
  }
}

export function normalizeRuntimeConfigValue<K extends RuntimeConfigKey>(
  key: K,
  raw: unknown,
  defaults: RuntimeConfigShape,
): RuntimeConfigShape[K] {
  switch (key) {
    case 'log.requestBody.enabled':
    case 'tts.enabled':
    case 'tts.enableInstruct':
    case 'ai.enabled': {
      if (typeof raw === 'boolean') return raw as RuntimeConfigShape[K]
      if (typeof raw === 'string') return (raw === 'true') as RuntimeConfigShape[K]
      return defaults[key]
    }
    case 'tts.sampleRate':
    case 'tts.speed':
    case 'log.system.sampleRate':
    case 'log.maxBodyBytes': {
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw as RuntimeConfigShape[K]
      if (typeof raw === 'string') {
        const n = Number(raw)
        if (Number.isFinite(n)) return n as RuntimeConfigShape[K]
      }
      return defaults[key]
    }
    case 'log.system.sampleLevels':
    case 'auth.trustedOrigins': {
      const fallback = defaults[key] as string[]
      if (Array.isArray(raw)) {
        return raw.map(String) as RuntimeConfigShape[K]
      }
      if (typeof raw === 'string') {
        return parseStringArray(raw, fallback) as RuntimeConfigShape[K]
      }
      return fallback as RuntimeConfigShape[K]
    }
    case 'ai.provider': {
      if ((VALID_PROVIDERS as readonly unknown[]).includes(raw)) return raw as RuntimeConfigShape[K]
      return defaults[key]
    }
    case 'tts.model':
    case 'tts.voice':
    case 'tts.format':
    case 'tts.instructPrefix':
    case 'log.dir':
    case 'ai.model':
    case 'ai.systemPrompt': {
      if (typeof raw === 'string' && raw.length > 0) return raw as RuntimeConfigShape[K]
      return defaults[key]
    }
    default:
      return defaults[key]
  }
}
