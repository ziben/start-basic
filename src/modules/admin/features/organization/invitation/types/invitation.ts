export type AdminInvitationInfo = {
  id: string
  email: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: string
  status: string
  createdAt: string
  expiresAt: string | null
}
