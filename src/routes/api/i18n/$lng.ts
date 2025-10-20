import { createFileRoute } from '@tanstack/react-router'
import { messages } from '~/i18n'
import prisma from '~/lib/db'

export const Route = createFileRoute('/api/i18n/$lng')({
  server: {
    handlers: {
      GET: async ({ params }: any) => {
        const { lng } = params
        if (!lng) return new Response('Locale required', { status: 400 })

        try {
          // Try to read from database first using typed Prisma client
          try {
            const rows = await prisma.translation.findMany({
              where: { locale: lng as string },
              select: { key: true, value: true },
            })

            if (rows && rows.length > 0) {
              const result: Record<string, string> = {}
              for (const r of rows) result[r.key] = r.value
              return Response.json(result)
            }
          } catch (dbErr) {
            // If the translation table doesn't exist or another DB error occurs, we'll fall back
            console.warn('translation table read failed, falling back to bundled messages', dbErr)
          }

          // Fallback to bundled messages
          const bundle = (messages as any)[lng] || {}
          return Response.json(bundle)
        } catch (err) {
          console.error('Failed to load translations for', lng, err)
          return new Response('Failed to load translations', { status: 500 })
        }
      },
    }
  }
})
