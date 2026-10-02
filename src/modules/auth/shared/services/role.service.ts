import { getDb } from '~/shared/lib/db'

export async function getDefaultNavigationRoleNames(): Promise<string[]> {
  const db = await getDb()
  const roles = await db.role.findMany({
    where: { name: { in: ['user', 'admin'] } },
    select: { name: true },
  })
  return roles.map((role) => role.name)
}

export async function getRoleNameById(id: string): Promise<string | null> {
  const db = await getDb()
  const role = await db.role.findUnique({
    where: { id },
    select: { name: true },
  })
  return role?.name ?? null
}
