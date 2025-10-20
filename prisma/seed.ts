// @ts-nocheck
import en from '../src/i18n/locales/en.ts'
import zh from '../src/i18n/locales/zh.ts'


function flatten(obj: any, prefix = ''): Record<string, string> {
  const res: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(res, flatten(value, path))
    } else {
      res[path] = String(value ?? '')
    }
  }
  return res
}

async function seed() {
  try {
    const enFlat = flatten(en)
    const zhFlat = flatten(zh)

    let inserted = 0
    let updated = 0

    // Upsert en
    for (const [key, value] of Object.entries(enFlat)) {
      const existing = await prisma.translation.findUnique({ where: { locale_key: { locale: 'en', key } as any } }).catch(() => null)
      if (existing) {
        await prisma.translation.update({ where: { id: existing.id }, data: { value } })
        updated++
      } else {
        await prisma.translation.create({ data: { locale: 'en', key, value } })
        inserted++
      }
    }

    // Upsert zh
    for (const [key, value] of Object.entries(zhFlat)) {
      const existing = await prisma.translation.findUnique({ where: { locale_key: { locale: 'zh', key } as any } }).catch(() => null)
      if (existing) {
        await prisma.translation.update({ where: { id: existing.id }, data: { value } })
        updated++
      } else {
        await prisma.translation.create({ data: { locale: 'zh', key, value } })
        inserted++
      }
    }

    console.log(`Seed complete. inserted=${inserted}, updated=${updated}`)
  } catch (err) {
    console.error('Seeding failed', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()

