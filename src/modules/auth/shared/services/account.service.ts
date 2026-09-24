import { getDb } from '~/shared/lib/db'

/**
 * Return the WeChat openid stored for an authenticated user.
 * Consumers must use this service instead of reading the auth-owned account table.
 */
export async function getWeChatOpenId(userId: string): Promise<string | null> {
  const db = await getDb()
  const account = await db.account.findFirst({
    where: { userId, providerId: 'wechat' },
    select: { idToken: true },
  })

  return account?.idToken ?? null
}
