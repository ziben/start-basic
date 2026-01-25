export type AdminSessionInfo = {
  id: string
  userId: string
  username: string
  email: string
  loginTime: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export type AdminSessionsPage = {
  items: AdminSessionInfo[]
  total: number
  pageCount: number
}
