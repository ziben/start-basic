
import { PrismaClient } from '../src/generated/prisma/client'
import { getDatabaseUrl } from '../src/shared/lib/database-url'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomUUID } from 'node:crypto'

const DATABASE_URL = getDatabaseUrl()
const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const ttsConfigs = [
    {
        key: 'tts.enabled',
        value: 'true',
        category: 'tts',
        valueType: 'BOOLEAN',
        description: '是否启用 TTS 功能',
    },
    {
        key: 'tts.model',
        value: 'qwen3-tts-instruct-flash',
        category: 'tts',
        valueType: 'STRING',
        description: 'TTS 模型名称',
    },
    {
        key: 'tts.voice',
        value: 'Serena',
        category: 'tts',
        valueType: 'STRING',
        description: 'TTS 音色名称',
    },
    {
        key: 'tts.format',
        value: 'mp3',
        category: 'tts',
        valueType: 'STRING',
        description: '音频输出格式',
    },
    {
        key: 'tts.sampleRate',
        value: '16000',
        category: 'tts',
        valueType: 'NUMBER',
        description: '音频采样率',
    },
    {
        key: 'tts.speed',
        value: '1.0',
        category: 'tts',
        valueType: 'NUMBER',
        description: '播放语速',
    },
    {
        key: 'tts.enableInstruct',
        value: 'true',
        category: 'tts',
        valueType: 'BOOLEAN',
        description: '是否启用语气指令控制',
    },
    {
        key: 'tts.instructPrefix',
        value: '语速偏慢，音调温柔平静，语气治愈温暖，像一位智者在娓娓道来。',
        category: 'tts',
        valueType: 'STRING',
        description: '语气指令前缀',
    },
]

async function seed() {
    console.log('🚀 开始导入 TTS 配置到数据库...')

    for (const config of ttsConfigs) {
        const existing = await prisma.systemConfig.findUnique({
            where: { key: config.key },
        })

        if (existing) {
            console.log(`  跳过已存在的配置: ${config.key}`)
            continue
        }

        await prisma.systemConfig.create({
            data: {
                id: randomUUID(),
                ...config,
                isPublic: false,
                isEnabled: true,
                version: 1,
            },
        })
        console.log(`  ✅ 已创建配置: ${config.key}`)
    }

    console.log('✨ TTS 配置导入完成!')
}

seed()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
