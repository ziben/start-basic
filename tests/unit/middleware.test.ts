import { describe, expect, it, vi, beforeEach } from 'vitest'
import { withAuth, withAdminAuth } from '@/middleware'
import { auth } from '~/modules/auth/shared/lib/auth'
import * as logWriter from '~/modules/admin/shared/services/server-log-writer'
import { getRequest } from '@tanstack/react-start/server'

// Mock dependencies
vi.mock('@tanstack/react-start/server', () => ({
    getRequest: vi.fn(),
}))

vi.mock('~/modules/auth/shared/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}))

vi.mock('~/modules/admin/shared/services/server-log-writer', () => ({
    createRequestId: vi.fn(() => 'test-request-id'),
    getIpFromRequest: vi.fn(() => '127.0.0.1'),
    getUserAgentFromRequest: vi.fn(() => 'test-user-agent'),
    readRequestBodySafe: vi.fn(() => Promise.resolve(null)),
    toErrorString: vi.fn((err) => String(err)),
    writeAuditLog: vi.fn(() => Promise.resolve()),
    writeSystemLog: vi.fn(() => Promise.resolve()),
}))

describe('Middleware Unit Tests', () => {
    const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Headers(),
    } as unknown as Request

    const mockHandler = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getRequest).mockReturnValue(mockRequest)
    })

    describe('withAuth', () => {
        it('should allow access for authenticated user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com', role: 'user' },
                session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'abc', createdAt: new Date(), updatedAt: new Date(), ipAddress: '127.0.0.1', userAgent: 'test' },
            } as any)

            const wrappedHandler = withAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(200)
            expect(mockHandler).toHaveBeenCalled()
            expect(logWriter.writeSystemLog).toHaveBeenCalledWith(expect.objectContaining({
                level: 'info',
                userId: 'user-1',
            }))
        })

        it('should block access for unauthenticated user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue(null)

            const wrappedHandler = withAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(403)
            expect(mockHandler).not.toHaveBeenCalled()
            expect(logWriter.writeSystemLog).toHaveBeenCalledWith(expect.objectContaining({
                level: 'warn',
                meta: { reason: 'forbidden' },
            }))
        })

        it('should handle errors gracefully', async () => {
            vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Auth failed'))

            const wrappedHandler = withAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(401)
            expect(logWriter.writeSystemLog).toHaveBeenCalledWith(expect.objectContaining({
                level: 'error',
                error: 'Error: Auth failed',
            }))
        })
    })

    describe('withAdminAuth', () => {
        it('should allow access for admin user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
                session: { id: 'session-1', userId: 'admin-1', expiresAt: new Date(), token: 'abc', createdAt: new Date(), updatedAt: new Date(), ipAddress: '127.0.0.1', userAgent: 'test' },
            } as any)

            const wrappedHandler = withAdminAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(200)
            expect(mockHandler).toHaveBeenCalled()
        })

        it('should allow access for superadmin user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: { id: 'admin-1', email: 'admin@example.com', role: 'superadmin' },
                session: { id: 'session-1', userId: 'admin-1', expiresAt: new Date(), token: 'abc', createdAt: new Date(), updatedAt: new Date(), ipAddress: '127.0.0.1', userAgent: 'test' },
            } as any)

            const wrappedHandler = withAdminAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(200)
            expect(mockHandler).toHaveBeenCalled()
        })

        it('should block access for non-admin user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: { id: 'user-1', email: 'user@example.com', role: 'user' },
                session: { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'abc', createdAt: new Date(), updatedAt: new Date(), ipAddress: '127.0.0.1', userAgent: 'test' },
            } as any)

            const wrappedHandler = withAdminAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(403)
            expect(mockHandler).not.toHaveBeenCalled()
        })

        it('should block access for unauthenticated user', async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue(null)

            const wrappedHandler = withAdminAuth(mockHandler)
            const response = await wrappedHandler({ request: mockRequest })

            expect(response.status).toBe(403)
            expect(mockHandler).not.toHaveBeenCalled()
        })
    })
})
