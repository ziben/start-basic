import { expect, it, vi } from 'vitest'
import { HealthPersonService } from './health-person.service'

const db = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: 'person-1', name: '本人' }),
}))

vi.mock('@/shared/lib/db', () => ({ default: { healthPerson: db } }))

it('lists only persons owned by the current user', async () => {
  await HealthPersonService.listForUser('user-1')
  expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerUserId: 'user-1' } }))
})

it('trims the person name before creating', async () => {
  await HealthPersonService.createForUser('user-1', { name: ' 本人 ' })
  expect(db.create).toHaveBeenCalledWith(expect.objectContaining({ data: { ownerUserId: 'user-1', name: '本人' } }))
})

it('normalizes optional profile fields before creating', async () => {
  await HealthPersonService.createForUser('user-1', {
    name: ' 本人 ',
    gender: ' 女 ',
    birthDate: '1990-01-02',
    relationLabel: ' 配偶 ',
    note: ' 既往信息 ',
  })

  expect(db.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        ownerUserId: 'user-1',
        name: '本人',
        gender: '女',
        birthDate: new Date('1990-01-02T00:00:00.000Z'),
        relationLabel: '配偶',
        note: '既往信息',
      },
    })
  )
})
