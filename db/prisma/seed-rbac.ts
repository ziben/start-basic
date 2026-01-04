import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../src/generated/prisma/client'

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./db/dev.db'
const adapter = new PrismaLibSql({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

/**
 * RBAC 系统种子数据
 * 创建默认权限和角色
 */

async function seedRBAC() {
    console.log('🌱 Seeding RBAC system...')

    // 1. 创建基础权限
    const permissions = [
        // 用户管理
        { name: 'user:create', label: '创建用户', resource: 'user', action: 'create', category: '用户管理' },
        { name: 'user:read', label: '查看用户', resource: 'user', action: 'read', category: '用户管理' },
        { name: 'user:update', label: '编辑用户', resource: 'user', action: 'update', category: '用户管理' },
        { name: 'user:delete', label: '删除用户', resource: 'user', action: 'delete', category: '用户管理' },
        { name: 'user:export', label: '导出用户', resource: 'user', action: 'export', category: '用户管理' },

        // 角色管理
        { name: 'role:create', label: '创建角色', resource: 'role', action: 'create', category: '角色管理' },
        { name: 'role:read', label: '查看角色', resource: 'role', action: 'read', category: '角色管理' },
        { name: 'role:update', label: '编辑角色', resource: 'role', action: 'update', category: '角色管理' },
        { name: 'role:delete', label: '删除角色', resource: 'role', action: 'delete', category: '角色管理' },
        { name: 'role:assign', label: '分配角色', resource: 'role', action: 'assign', category: '角色管理' },

        // 部门管理
        { name: 'department:create', label: '创建部门', resource: 'department', action: 'create', category: '部门管理' },
        { name: 'department:read', label: '查看部门', resource: 'department', action: 'read', category: '部门管理' },
        { name: 'department:update', label: '编辑部门', resource: 'department', action: 'update', category: '部门管理' },
        { name: 'department:delete', label: '删除部门', resource: 'department', action: 'delete', category: '部门管理' },

        // 菜单管理
        { name: 'menu:create', label: '创建菜单', resource: 'menu', action: 'create', category: '菜单管理' },
        { name: 'menu:read', label: '查看菜单', resource: 'menu', action: 'read', category: '菜单管理' },
        { name: 'menu:update', label: '编辑菜单', resource: 'menu', action: 'update', category: '菜单管理' },
        { name: 'menu:delete', label: '删除菜单', resource: 'menu', action: 'delete', category: '菜单管理' },

        // 权限管理
        { name: 'permission:create', label: '创建权限', resource: 'permission', action: 'create', category: '权限管理' },
        { name: 'permission:read', label: '查看权限', resource: 'permission', action: 'read', category: '权限管理' },
        { name: 'permission:update', label: '编辑权限', resource: 'permission', action: 'update', category: '权限管理' },
        { name: 'permission:delete', label: '删除权限', resource: 'permission', action: 'delete', category: '权限管理' },
        { name: 'permission:assign', label: '分配权限', resource: 'permission', action: 'assign', category: '权限管理' },
    ]

    console.log('  📝 Creating permissions...')
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: perm,
            create: perm,
        })
    }
    console.log(`  ✅ Created ${permissions.length} permissions`)

    // 2. 更新现有角色，添加 scope
    console.log('  🔄 Updating existing roles...')

    const adminRole = await prisma.systemRole.findUnique({
        where: { name: 'admin' }
    })

    if (adminRole) {
        await prisma.systemRole.update({
            where: { id: adminRole.id },
            data: { scope: 'GLOBAL' }
        })
        console.log('  ✅ Updated admin role')
    }

    const userRole = await prisma.systemRole.findUnique({
        where: { name: 'user' }
    })

    if (userRole) {
        await prisma.systemRole.update({
            where: { id: userRole.id },
            data: { scope: 'GLOBAL' }
        })
        console.log('  ✅ Updated user role')
    }

    // 3. 创建新的组织级角色
    console.log('  👥 Creating organization roles...')

    const orgAdminRole = await prisma.systemRole.upsert({
        where: { name: 'org_admin' },
        update: {},
        create: {
            name: 'org_admin',
            label: '组织管理员',
            description: '管理组织内的所有资源',
            scope: 'ORG',
            isSystem: true,
        }
    })
    console.log('  ✅ Created org_admin role')

    const deptAdminRole = await prisma.systemRole.upsert({
        where: { name: 'dept_admin' },
        update: {},
        create: {
            name: 'dept_admin',
            label: '部门管理员',
            description: '管理本部门及下级部门的资源',
            scope: 'DEPT',
            isSystem: true,
        }
    })
    console.log('  ✅ Created dept_admin role')

    // 4. 为超级管理员分配所有权限
    if (adminRole) {
        console.log('  🔐 Assigning permissions to admin role...')
        const allPermissions = await prisma.permission.findMany()

        for (const perm of allPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: adminRole.id,
                        permissionId: perm.id
                    }
                },
                update: {},
                create: {
                    roleId: adminRole.id,
                    permissionId: perm.id,
                    dataScope: 'ALL', // 超级管理员可以访问所有数据
                }
            })
        }
        console.log(`  ✅ Assigned ${allPermissions.length} permissions to admin`)
    }

    // 5. 为组织管理员分配权限
    console.log('  🔐 Assigning permissions to org_admin role...')
    const orgAdminPermissions = await prisma.permission.findMany({
        where: {
            name: {
                in: [
                    'user:create', 'user:read', 'user:update', 'user:delete',
                    'role:read', 'role:assign',
                    'department:create', 'department:read', 'department:update', 'department:delete',
                    'menu:read',
                ]
            }
        }
    })

    for (const perm of orgAdminPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: orgAdminRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: orgAdminRole.id,
                permissionId: perm.id,
                dataScope: 'ORG', // 组织管理员只能访问本组织数据
            }
        })
    }
    console.log(`  ✅ Assigned ${orgAdminPermissions.length} permissions to org_admin`)

    // 6. 为部门管理员分配权限
    console.log('  🔐 Assigning permissions to dept_admin role...')
    const deptAdminPermissions = await prisma.permission.findMany({
        where: {
            name: {
                in: [
                    'user:read', 'user:update',
                    'department:read',
                ]
            }
        }
    })

    for (const perm of deptAdminPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: deptAdminRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: deptAdminRole.id,
                permissionId: perm.id,
                dataScope: 'DEPT_AND_SUB', // 部门管理员可以访问本部门及下级部门数据
            }
        })
    }
    console.log(`  ✅ Assigned ${deptAdminPermissions.length} permissions to dept_admin`)

    // 7. 为普通用户分配基础权限
    if (userRole) {
        console.log('  🔐 Assigning permissions to user role...')
        const userPermissions = await prisma.permission.findMany({
            where: {
                name: {
                    in: ['user:read', 'menu:read']
                }
            }
        })

        for (const perm of userPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: userRole.id,
                        permissionId: perm.id
                    }
                },
                update: {},
                create: {
                    roleId: userRole.id,
                    permissionId: perm.id,
                    dataScope: 'SELF', // 普通用户只能访问自己的数据
                }
            })
        }
        console.log(`  ✅ Assigned ${userPermissions.length} permissions to user`)
    }

    console.log('✅ RBAC system seeded successfully!')
}

async function main() {
    try {
        await seedRBAC()
    } catch (error) {
        console.error('❌ Error seeding database:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
