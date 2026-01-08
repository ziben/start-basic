/**
 * 权限系统数据初始化脚本
 * 初始化角色、资源、操作、权限和角色-权限关联
 */

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../src/generated/prisma/client'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db'
const adapter = new PrismaLibSql({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 开始初始化权限系统数据...\n')

  // ============================================
  // 1. 创建资源（Resources）
  // ============================================
  console.log('📦 创建资源...')
  
  const resourcesData = [
    // 全局资源
    { name: 'user', displayName: '用户', scope: 'GLOBAL', isSystem: true },
    { name: 'org', displayName: '组织', scope: 'GLOBAL', isSystem: true },
    { name: 'role', displayName: '角色', scope: 'GLOBAL', isSystem: true },
    { name: 'permission', displayName: '权限', scope: 'GLOBAL', isSystem: true },
    { name: 'nav', displayName: '导航', scope: 'GLOBAL', isSystem: true },
    { name: 'profile', displayName: '个人资料', scope: 'BOTH', isSystem: true },
    
    // 组织资源
    { name: 'member', displayName: '成员', scope: 'ORGANIZATION', isSystem: true },
    { name: 'project', displayName: '项目', scope: 'ORGANIZATION', isSystem: true },
    { name: 'document', displayName: '文档', scope: 'ORGANIZATION', isSystem: true },
    { name: 'settings', displayName: '设置', scope: 'ORGANIZATION', isSystem: true },
  ]

  const resources = []
  for (const data of resourcesData) {
    const resource = await prisma.resource.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    })
    resources.push(resource)
    console.log(`  ✓ ${resource.displayName} (${resource.name})`)
  }

  // ============================================
  // 2. 创建操作（Actions）
  // ============================================
  console.log('\n⚡ 创建操作...')
  
  const actionsData = [
    { name: 'create', displayName: '创建' },
    { name: 'read', displayName: '查看' },
    { name: 'update', displayName: '更新' },
    { name: 'delete', displayName: '删除' },
    { name: 'manage', displayName: '管理' },
    { name: 'ban', displayName: '禁用' },
    { name: 'invite', displayName: '邀请' },
    { name: 'remove', displayName: '移除' },
    { name: 'share', displayName: '分享' },
  ]

  const actions = []
  for (const resource of resources) {
    // 根据资源类型分配不同的操作
    let resourceActions = []
    
    if (resource.name === 'user') {
      resourceActions = ['create', 'read', 'update', 'delete', 'ban']
    } else if (resource.name === 'org') {
      resourceActions = ['create', 'read', 'update', 'delete']
    } else if (resource.name === 'role' || resource.name === 'permission' || resource.name === 'nav') {
      resourceActions = ['manage']
    } else if (resource.name === 'profile') {
      resourceActions = ['read', 'update']
    } else if (resource.name === 'member') {
      resourceActions = ['manage', 'invite', 'remove', 'update']
    } else if (resource.name === 'project') {
      resourceActions = ['create', 'read', 'update', 'delete']
    } else if (resource.name === 'document') {
      resourceActions = ['create', 'read', 'update', 'delete', 'share']
    } else if (resource.name === 'settings') {
      resourceActions = ['read', 'update']
    }

    for (const actionName of resourceActions) {
      const actionData = actionsData.find(a => a.name === actionName)!
      const action = await prisma.action.upsert({
        where: {
          resourceId_name: {
            resourceId: resource.id,
            name: actionName,
          },
        },
        update: {},
        create: {
          resourceId: resource.id,
          name: actionName,
          displayName: actionData.displayName,
          isSystem: true,
        },
      })
      actions.push(action)
    }
  }
  console.log(`  ✓ 创建了 ${actions.length} 个操作`)

  // ============================================
  // 3. 创建权限（Permissions）
  // ============================================
  console.log('\n🔐 创建权限...')
  
  const permissions = []
  for (const action of actions) {
    const resource = resources.find(r => r.id === action.resourceId)!
    const code = `${resource.name}:${action.name}`
    const displayName = `${action.displayName}${resource.displayName}`
    
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        resourceId: resource.id,
        actionId: action.id,
        code,
        displayName,
        description: `允许${displayName}`,
        category: resource.scope === 'GLOBAL' ? '系统管理' : '组织管理',
        isSystem: true,
      },
    })
    permissions.push(permission)
  }
  console.log(`  ✓ 创建了 ${permissions.length} 个权限`)

  // ============================================
  // 4. 创建角色（Roles）
  // ============================================
  console.log('\n👥 创建角色...')
  
  const rolesData = [
    // 全局角色
    {
      name: 'superadmin',
      displayName: '超级管理员',
      description: '拥有系统所有权限',
      scope: 'GLOBAL',
      isSystem: true,
      permissions: permissions.map(p => p.code), // 所有权限
    },
    {
      name: 'admin',
      displayName: '管理员',
      description: '系统管理员，可管理用户、组织、角色和权限',
      scope: 'GLOBAL',
      isSystem: true,
      permissions: [
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:ban',
        'org:create', 'org:read', 'org:update', 'org:delete',
        'role:manage',
        'permission:manage',
        'nav:manage',
        'profile:read', 'profile:update',
      ],
    },
    {
      name: 'user',
      displayName: '普通用户',
      description: '普通用户，只能管理自己的资料',
      scope: 'GLOBAL',
      isSystem: true,
      permissions: ['profile:read', 'profile:update'],
    },
    
    // 组织角色
    {
      name: 'owner',
      displayName: '组织所有者',
      description: '组织所有者，拥有组织内所有权限',
      scope: 'ORGANIZATION',
      isSystem: true,
      permissions: [
        'member:manage', 'member:invite', 'member:remove', 'member:update',
        'project:create', 'project:read', 'project:update', 'project:delete',
        'document:create', 'document:read', 'document:update', 'document:delete', 'document:share',
        'settings:read', 'settings:update',
      ],
    },
    {
      name: 'admin',
      displayName: '组织管理员',
      description: '组织管理员，可管理成员和项目',
      scope: 'ORGANIZATION',
      isSystem: true,
      permissions: [
        'member:manage', 'member:invite', 'member:remove', 'member:update',
        'project:create', 'project:read', 'project:update', 'project:delete',
        'document:create', 'document:read', 'document:update', 'document:delete', 'document:share',
        'settings:read',
      ],
    },
    {
      name: 'member',
      displayName: '组织成员',
      description: '组织普通成员，可查看和编辑项目',
      scope: 'ORGANIZATION',
      isSystem: true,
      permissions: [
        'project:read', 'project:update',
        'document:create', 'document:read', 'document:update', 'document:share',
        'settings:read',
      ],
    },
    {
      name: 'viewer',
      displayName: '组织访客',
      description: '组织访客，只能查看内容',
      scope: 'ORGANIZATION',
      isSystem: true,
      permissions: [
        'project:read',
        'document:read',
        'settings:read',
      ],
    },
  ]

  const roles = []
  for (const roleData of rolesData) {
    const { permissions: permCodes, ...roleInfo } = roleData
    
    const role = await prisma.role.upsert({
      where: { name: `${roleData.scope}:${roleData.name}` },
      update: {},
      create: {
        ...roleInfo,
        name: `${roleData.scope}:${roleData.name}`, // 添加作用域前缀避免冲突
      },
    })
    roles.push({ role, permCodes })
    console.log(`  ✓ ${role.displayName} (${roleData.name})`)
  }

  // ============================================
  // 5. 创建角色-权限关联（RolePermissions）
  // ============================================
  console.log('\n🔗 创建角色-权限关联...')
  
  let totalAssignments = 0
  for (const { role, permCodes } of roles) {
    for (const code of permCodes) {
      const permission = permissions.find(p => p.code === code)
      if (!permission) {
        console.warn(`  ⚠️  权限 ${code} 不存在，跳过`)
        continue
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
      totalAssignments++
    }
  }
  console.log(`  ✓ 创建了 ${totalAssignments} 个角色-权限关联`)

  console.log('\n✅ 权限系统数据初始化完成！')
  console.log('\n📊 统计信息:')
  console.log(`  - 资源: ${resources.length}`)
  console.log(`  - 操作: ${actions.length}`)
  console.log(`  - 权限: ${permissions.length}`)
  console.log(`  - 角色: ${roles.length}`)
  console.log(`  - 角色-权限关联: ${totalAssignments}`)
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
