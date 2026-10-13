import prisma from '@/shared/lib/db'

export interface CreateHealthPersonInput {
  readonly name: string
  readonly gender?: string
  readonly birthDate?: string
  readonly relationLabel?: string
  readonly note?: string
}

export const HealthPersonService = {
  async listForUser(userId: string) {
    return prisma.healthPerson.findMany({
      where: { ownerUserId: userId },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        relationLabel: true,
      },
    })
  },

  async createForUser(userId: string, input: CreateHealthPersonInput) {
    const name = input.name.trim()
    if (!name) throw new Error('健康档案人员姓名不能为空')

    const gender = input.gender?.trim()
    const relationLabel = input.relationLabel?.trim()
    const note = input.note?.trim()

    return prisma.healthPerson.create({
      data: {
        ownerUserId: userId,
        name,
        ...(gender ? { gender } : {}),
        ...(input.birthDate ? { birthDate: parseDateOnly(input.birthDate) } : {}),
        ...(relationLabel ? { relationLabel } : {}),
        ...(note ? { note } : {}),
      },
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        relationLabel: true,
      },
    })
  },
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('出生日期格式不正确')
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('出生日期格式不正确')
  }
  return parsed
}
