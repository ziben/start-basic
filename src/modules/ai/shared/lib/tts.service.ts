/**
 * TTS Service - 阿里云语音合成（DashScope Qwen3-TTS）
 *
 * 升级说明（vs 旧版 CosyVoice-v2）：
 * - 模型：cosyvoice-v2 → qwen3-tts-flash
 * - API：text2audiox/audio → multimodal-generation/generation
 * - 返回方式：二进制流 → JSON 含 audio_url（有效期 24h），需二次下载
 * - 延迟：~1s → ~97ms（首包，流式场景）
 * - 音色：longxiaochun → Serena（苏瑶，温柔小姐姐，最适合禅意场景）
 * - 指令控制：支持在输入文本前插入自然语言指令控制语气
 *
 * 功能：
 * 1. 通过 messageId 从数据库读取消息内容（安全，防前端伪造）
 * 2. 以文本内容 MD5 为 Key 缓存 MP3 到 public/audio_cache/，相同内容只合成一次
 * 3. 复用 QWEN_API_KEY，无需额外申请阿里云 Appkey
 */
import crypto from 'node:crypto'
import fs from 'fs'
import path from 'path'
import { getRuntimeConfig } from '~/shared/config/runtime-config'

// ─── 配置读取 ──────────────────────────────────────────────────────────────────

function getTTSConfig() {
    const apiKey = process.env.QWEN_API_KEY
    if (!apiKey) {
        throw new Error('[TTS] 缺少 QWEN_API_KEY，请在 .env 中配置')
    }

    return {
        apiKey,
        model: getRuntimeConfig('tts.model'),
        voice: getRuntimeConfig('tts.voice'),
        format: getRuntimeConfig('tts.format'),
        sampleRate: getRuntimeConfig('tts.sampleRate'),
        speed: getRuntimeConfig('tts.speed'),
        cacheDir: process.env.TTS_CACHE_DIR ?? 'audio_cache', // 缓存目录建议保持 env 以防部署环境差异
        enableInstruct: getRuntimeConfig('tts.enableInstruct'),
        instructPrefix: getRuntimeConfig('tts.instructPrefix'),
    }
}

// ─── 缓存目录工具 ──────────────────────────────────────────────────────────────

function ensureCacheDir(cacheSubDir: string): string {
    const absDir = path.join(process.cwd(), 'public', cacheSubDir)
    if (!fs.existsSync(absDir)) {
        fs.mkdirSync(absDir, { recursive: true })
    }
    return absDir
}

function textToFileName(text: string, model: string, voice: string, format: string, sampleRate: number): string {
    // 将模型、音色、采样率等参数也纳入 hash
    const hash = crypto.createHash('md5')
        .update(`${model}:${voice}:${sampleRate}:${format}:${text}`)
        .digest('hex')
    return `${hash}.${format}`
}

// ─── 阿里云 Qwen3-TTS API 调用 ────────────────────────────────────────────────

/**
 * Qwen3-TTS 非流式接口：返回 JSON，output.audio.url 是音频 URL（有效期 24h）
 * API：POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 */
async function callQwenTTS(
    text: string,
    config: ReturnType<typeof getTTSConfig>,
): Promise<Buffer> {
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

    const body = {
        model: config.model,
        input: {
            text: text,
            // 语气/情感指令放在 prompt 字段（Qwen3-TTS 合理的指令传递方式）
            prompt: config.enableInstruct ? config.instructPrefix : undefined,
            voice: config.voice,
            language_type: 'Chinese',
        },
        parameters: {
            format: config.format,
            sample_rate: config.sampleRate,
            speed: config.speed,
        },
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`[TTS] Qwen3-TTS 接口错误 ${response.status}: ${errText}`)
    }

    const data = await response.json()

    // 正常响应结构：{ output: { audio: { url: "https://...", format: "mp3" } } }
    const audioUrl: string | undefined = data?.output?.audio?.url

    if (!audioUrl) {
        throw new Error(`[TTS] Qwen3-TTS 未返回音频 URL: ${JSON.stringify(data)}`)
    }

    // 二次请求：下载音频内容
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) {
        throw new Error(`[TTS] 下载音频失败 ${audioRes.status}: ${audioUrl}`)
    }

    const arrayBuffer = await audioRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

// ─── 对外暴露的主方法 ──────────────────────────────────────────────────────────

export interface TTSResult {
    /** 可供前端直接访问的静态资源路径，如 /audio_cache/abc123.mp3 */
    audioUrl: string
    /** 是否命中本地缓存（用于调试/监控） */
    cached: boolean
}

/**
 * 根据文本内容生成（或复用缓存的）语音文件，返回可访问的 URL 路径。
 *
 * @param text 要合成的文本内容
 * @returns TTSResult
 */
export async function getOrGenerateTTS(text: string): Promise<TTSResult> {
    if (!text?.trim()) {
        throw new Error('[TTS] 文本内容不能为空')
    }

    const config = getTTSConfig()
    const cacheDir = ensureCacheDir(config.cacheDir)
    const fileName = textToFileName(text.trim(), config.model, config.voice, config.format, config.sampleRate)
    const filePath = path.join(cacheDir, fileName)
    const publicPath = `/${config.cacheDir}/${fileName}`

    // 命中缓存：直接返回
    if (fs.existsSync(filePath)) {
        return { audioUrl: publicPath, cached: true }
    }

    // 未命中：调用 Qwen3-TTS 合成
    console.log(`[TTS] 合成新音频: model=${config.model} voice=${config.voice} len=${text.length}`)
    const audioBuffer = await callQwenTTS(text.trim(), config)

    // 写入缓存文件
    fs.writeFileSync(filePath, audioBuffer)
    console.log(`[TTS] 音频已缓存: ${filePath}`)

    return { audioUrl: publicPath, cached: false }
}
