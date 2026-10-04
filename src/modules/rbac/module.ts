import { defineModule } from '~/core/module-registry'
import { PermissionService } from './permissions/services/permission.service'
import { ResourceService } from './permissions/services/rbac-resource.service'
import { RolePermissionService } from './permissions/services/role-permission.service'
import { RoleService } from './system-roles/services/role.service'

export const rbacModule = defineModule({
  key: 'rbac',
  version: '1.0.0',
  dependencies: ['auth', 'navigation', 'organization'],
  exports: {
    services: {
      PermissionService,
      ResourceService,
      RolePermissionService,
      RoleService,
    },
  },
})

export type RbacModule = typeof rbacModule
