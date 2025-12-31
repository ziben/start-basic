import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@libsql/client'
import { serializeError } from '@prisma/studio-core/data/bff'

const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:./db/dev.db',
})

async function executeQuery(query: { sql: string; parameters: unknown[] }): Promise<[Error] | [null, unknown[]]> {
  try {
    const result = await db.execute({ sql: query.sql, args: query.parameters as any[] })
    // libsql Row 已经是对象格式，但需要转成普通对象（去掉 Row 的特殊属性）
    // 同时解析 JSON 字符串字段（如 columns）
    const rows = result.rows.map((row) => {
      const obj: Record<string, unknown> = {}
      for (const col of result.columns) {
        let val = row[col as keyof typeof row]
        // 尝试解析 JSON 字符串
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try {
            val = JSON.parse(val)
          } catch {
            // ignore parse errors
          }
        }
        obj[col] = val
      }
      return obj
    })
    return [null, rows]
  } catch (error) {
    console.error('[studio] error:', error)
    return [error as Error]
  }
}

export const Route = createFileRoute('/studio')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { procedure, query, sequence } = body

        if (procedure === 'sequence' && sequence) {
          // 处理序列查询
          const results: unknown[] = []
          for (const q of sequence) {
            const result = await executeQuery(q)
            results.push(result)
            if (result.length === 1) {
              // 出错了，停止执行
              break
            }
          }
          return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // 默认处理单个查询
        const result = await executeQuery(query)
        if (result.length === 1) {
          return new Response(JSON.stringify([serializeError(result[0])]), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})

