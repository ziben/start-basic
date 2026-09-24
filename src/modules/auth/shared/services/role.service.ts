import { getDb } from '~/shared/lib/db'

export async function getDefaultNavigationRoleNames(): Promise<string[]> {
  const db = await getDb()
  const roles = await db.role.findMany({
    where: { name: { in: ['user', 'admin'] } },
    select: { name: true },
  })
  return roles.map((role) => role.name)
}
