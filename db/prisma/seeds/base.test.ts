import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Prisma } from '../../../src/generated/prisma/client'
import { seedAdminUser } from './base'

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn().mockResolvedValue('new-password-hash'),
}))

vi.mock('better-auth/crypto', () => ({ hashPassword: mocks.hashPassword }))
vi.mock('~/shared/lib/db', () => ({ getDb: vi.fn() }))

function createDatabase() {
  const database = {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'actual-user-id' }) },
    account: {
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    },
  }
  return { database, transaction: database as unknown as Prisma.TransactionClient }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SEED_ADMIN_PASSWORD', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('seed admin credential identity', () => {
  it('repairs a legacy email accountId without changing the existing password', async () => {
    const { database, transaction } = createDatabase()
    database.account.findFirst.mockResolvedValue({
      id: 'existing-account',
      accountId: 'admin@example.com',
      password: 'existing-password-hash',
    })

    await seedAdminUser(transaction)

    expect(database.account.findFirst).toHaveBeenCalledWith({
      where: { userId: 'actual-user-id', providerId: 'credential' },
    })
    expect(database.account.update).toHaveBeenCalledWith({
      where: { id: 'existing-account' },
      data: { accountId: 'actual-user-id' },
    })
    expect(mocks.hashPassword).not.toHaveBeenCalled()
    expect(database.account.create).not.toHaveBeenCalled()
  })

  it('leaves an already valid credential account unchanged on repeated seed runs', async () => {
    const { database, transaction } = createDatabase()
    database.account.findFirst.mockResolvedValue({
      id: 'existing-account',
      accountId: 'actual-user-id',
    })

    await seedAdminUser(transaction)
    await seedAdminUser(transaction)

    expect(database.account.update).not.toHaveBeenCalled()
    expect(database.account.create).not.toHaveBeenCalled()
    expect(mocks.hashPassword).not.toHaveBeenCalled()
  })

  it('creates a credential account keyed by user ID when a password is explicitly provided', async () => {
    const { database, transaction } = createDatabase()
    database.account.findFirst.mockResolvedValue(null)
    vi.stubEnv('SEED_ADMIN_PASSWORD', ' new-password ')

    await seedAdminUser(transaction)

    expect(mocks.hashPassword).toHaveBeenCalledWith('new-password')
    expect(database.account.create).toHaveBeenCalledWith({
      data: {
        id: 'admin-account-id',
        userId: 'actual-user-id',
        accountId: 'actual-user-id',
        providerId: 'credential',
        password: 'new-password-hash',
      },
    })
  })

  it('updates both identity and password only when a replacement password is explicitly provided', async () => {
    const { database, transaction } = createDatabase()
    database.account.findFirst.mockResolvedValue({
      id: 'existing-account',
      accountId: 'admin@example.com',
    })
    vi.stubEnv('SEED_ADMIN_PASSWORD', 'replacement-password')

    await seedAdminUser(transaction)

    expect(database.account.update).toHaveBeenCalledWith({
      where: { id: 'existing-account' },
      data: { accountId: 'actual-user-id', password: 'new-password-hash' },
    })
  })

  it('requires an explicit password before creating a new credential account', async () => {
    const { database, transaction } = createDatabase()
    database.account.findFirst.mockResolvedValue(null)

    await expect(seedAdminUser(transaction)).rejects.toThrow('SEED_ADMIN_PASSWORD is required')
    expect(database.account.create).not.toHaveBeenCalled()
    expect(mocks.hashPassword).not.toHaveBeenCalled()
  })
})
