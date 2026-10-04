import { defineModule } from '~/core/module-registry'
import { DepartmentService } from './departments/services/department.service'
import { InvitationService } from './invitation/services/invitation.service'
import { MemberService } from './members/services/member.service'
import { OrganizationService } from './organizations/services/organization.service'

export const organizationModule = defineModule({
  key: 'organization',
  version: '1.0.0',
  dependencies: ['auth', 'identity'],
  exports: {
    services: {
      DepartmentService,
      InvitationService,
      MemberService,
      OrganizationService,
    },
  },
})

export type OrganizationModule = typeof organizationModule
