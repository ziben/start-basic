/**
 * Organization Types
 *
 * [迁移自 admin/shared/types/organization.ts]
 */

export type AdminOrganizationInfo = {
    id: string
    name: string
    slug: string
    logo: string
    createdAt: string
    metadata: string
    memberCount: number
    invitationCount: number
}
