import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { tasksPageSchema, tasks } from '@/modules/demo'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  filter: z.string().optional().default(''),
  status: z.array(z.string()).optional().default([]),
  priority: z.array(z.string()).optional().default([]),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

function parseArrayParam(url: URL, key: string): string[] {
  const all = url.searchParams.getAll(key)
  if (all.length === 0) return []
  return all
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean)
}

export const Route = createFileRoute('/api/demo/tasks/' as never)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = querySchema.parse({
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
          filter: url.searchParams.get('filter') ?? undefined,
          status: parseArrayParam(url, 'status'),
          priority: parseArrayParam(url, 'priority'),
          sortBy: url.searchParams.get('sortBy') ?? undefined,
          sortDir: url.searchParams.get('sortDir') ?? undefined,
        })

        const filterValue = parsed.filter.trim().toLowerCase()

        const base = tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          label: t.label,
          priority: t.priority,
        }))

        const filtered = base
          .filter((t) => {
            if (parsed.status.length > 0 && !parsed.status.includes(t.status)) {
              return false
            }
            if (parsed.priority.length > 0 && !parsed.priority.includes(t.priority)) {
              return false
            }
            if (!filterValue) return true
            return t.id.toLowerCase().includes(filterValue) || t.title.toLowerCase().includes(filterValue)
          })
          .sort((a, b) => {
            if (!parsed.sortBy) return 0
            const dir = parsed.sortDir === 'desc' ? -1 : 1
            const key = parsed.sortBy

            const av = (a as Record<string, unknown>)[key]
            const bv = (b as Record<string, unknown>)[key]

            if (typeof av === 'string' && typeof bv === 'string') {
              return av.localeCompare(bv) * dir
            }
            return 0
          })

        const total = filtered.length
        const pageSize = parsed.pageSize
        const pageCount = Math.ceil(total / pageSize)
        const page = Math.min(Math.max(parsed.page, 1), Math.max(pageCount, 1))

        const start = (page - 1) * pageSize
        const items = filtered.slice(start, start + pageSize)

        return Response.json(
          tasksPageSchema.parse({
            items,
            total,
            page,
            pageSize,
            pageCount,
          })
        )
      },
    },
  },
})




