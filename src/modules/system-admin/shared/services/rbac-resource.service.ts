/**
 * RBAC Resource Service - 处理资源、操作、权限的业务逻辑
 */
import prisma from '@/shared/lib/db'

export const ResourceService = {
  // ============ 资源管理 ============
  async getResources() {
    return prisma.resource.findMany({
      include: {
        actions: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    })
  },

  async createResource(data: { name: string; displayName: string; description?: string; scope: 'GLOBAL' | 'ORGANIZATION' | 'BOTH' }) {
    return prisma.resource.create({
      data: {
        ...data,
        isSystem: false,
      },
    })
  },

  async updateResource(id: string, data: { displayName?: string; description?: string }) {
    const resource = await prisma.resource.findUnique({ where: { id } })
    if (resource?.isSystem) {
      throw new Error('系统资源不允许修改')
    }
    return prisma.resource.update({
      where: { id },
      data,
    })
  },

  async deleteResource(id: string) {
    const resource = await prisma.resource.findUnique({ where: { id } })
    if (resource?.isSystem) {
      throw new Error('系统资源不允许删除')
    }
    return prisma.resource.delete({
      where: { id },
    })
  },

  // ============ 操作管理 ============
  async getActions(resourceId?: string) {
    return prisma.action.findMany({
      where: resourceId ? { resourceId } : undefined,
      include: {
        resource: true,
      },
      orderBy: { name: 'asc' },
    })
  },

  async createAction(data: { resourceId: string; name: string; displayName: string; description?: string }) {
    return prisma.action.create({
      data: {
        ...data,
        isSystem: false,
      },
      include: {
        resource: true,
      },
    })
  },

  async updateAction(id: string, data: { displayName?: string; description?: string }) {
    const action = await prisma.action.findUnique({ where: { id } })
    if (action?.isSystem) {
      throw new Error('系统操作不允许修改')
    }
    return prisma.action.update({
      where: { id },
      data,
    })
  },

  async deleteAction(id: string) {
    const action = await prisma.action.findUnique({ where: { id } })
    if (action?.isSystem) {
      throw new Error('系统操作不允许删除')
    }
    return prisma.action.delete({
      where: { id },
    })
  },

  // ============ 权限管理 ============
  async getPermissions() {
    return prisma.permission.findMany({
      include: {
        resource: true,
        action: true,
      },
      orderBy: { code: 'asc' },
    })
  },

  async createPermission(data: { resourceId: string; actionId: string; displayName: string; description?: string; category?: string }) {
    const resource = await prisma.resource.findUnique({ where: { id: data.resourceId } })
    const action = await prisma.action.findUnique({ where: { id: data.actionId } })
    
    if (!resource || !action) {
      throw new Error('资源或操作不存在')
    }
    
    const code = `${resource.name}:${action.name}`
    
    return prisma.permission.create({
      data: {
        ...data,
        code,
        isSystem: false,
      },
      include: {
        resource: true,
        action: true,
      },
    })
  },

  async updatePermission(id: string, data: { displayName?: string; description?: string; category?: string }) {
    const permission = await prisma.permission.findUnique({ where: { id } })
    if (permission?.isSystem) {
      throw new Error('系统权限不允许修改')
    }
    return prisma.permission.update({
      where: { id },
      data,
    })
  },

  async deletePermission(id: string) {
    const permission = await prisma.permission.findUnique({ where: { id } })
    if (permission?.isSystem) {
      throw new Error('系统权限不允许删除')
    }
    return prisma.permission.delete({
      where: { id },
    })
  },
}
