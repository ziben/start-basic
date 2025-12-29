import type { AdminUser } from '@/modules/system-admin/features/identity/users'

// 本地类型定义，避免导入 Prisma Client
type PrismaUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  username: string | null
  displayUsername: string | null
}

/**
 * Sort fields allowed for user queries
 */
export const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'email', 'username', 'role', 'banned'] as const
export type UserSortField = (typeof USER_SORT_FIELDS)[number]

/**
 * Check if a string is a valid sort field
 */
export function isValidUserSortField(value: string): value is UserSortField {
  return USER_SORT_FIELDS.includes(value as UserSortField)
}

/**
 * Allowed user roles
 */
export const USER_ROLES = ['admin', 'user'] as const
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Check if a string is a valid user role
 */
export function isValidUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

/**
 * Serialize Prisma User to AdminUsers schema format
 */
export function serializeAdminUser(user: PrismaUser): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role ?? 'user',
    banned: user.banned ?? null,
    banReason: user.banReason ?? null,
    banExpires: user.banExpires ?? null,
    username: user.username ?? null,
    displayUsername: user.displayUsername ?? null,
  }
}

/**
 * Serialize array of Prisma Users to AdminUsers format
 */
export function serializeAdminUsers(users: PrismaUser[]): AdminUser[] {
  return users.map(serializeAdminUser)
}

/**
 * Create a proper error response for API errors
 */
export type ApiErrorType = 'validation' | 'not_found' | 'conflict' | 'server' | 'unauthorized'

export interface ApiError {
  type: ApiErrorType
  message: string
  details?: unknown
}

export function createErrorResponse(error: ApiError, status: number = 400): Response {
  return Response.json(error, { status })
}

/**
 * Handle various error types and convert to ApiError
 */
export function handleError(error: unknown): ApiError {
  // Zod validation error
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return {
      type: 'validation',
      message: 'Validation failed',
      details: error,
    }
  }

  // Prisma known errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } }

    // Record not found
    if (prismaError.code === 'P2025') {
      return {
        type: 'not_found',
        message: 'Record not found',
      }
    }

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.join(', ') ?? 'field'
      return {
        type: 'conflict',
        message: `A record with this ${target} already exists`,
        details: { target: prismaError.meta?.target },
      }
    }

    // Foreign key constraint
    if (prismaError.code === 'P2003') {
      return {
        type: 'validation',
        message: 'Invalid reference to related record',
      }
    }
  }

  // Generic error
  if (error instanceof Error) {
    return {
      type: 'server',
      message: error.message || 'An unexpected error occurred',
    }
  }

  // String error
  if (typeof error === 'string') {
    return {
      type: 'server',
      message: error,
    }
  }

  return {
    type: 'server',
    message: 'An unexpected error occurred',
  }
}

/**
 * Map ApiError type to HTTP status code
 */
export function getErrorStatus(type: ApiErrorType): number {
  switch (type) {
    case 'validation':
      return 400
    case 'unauthorized':
      return 401
    case 'not_found':
      return 404
    case 'conflict':
      return 409
    default:
      return 500
  }
}




