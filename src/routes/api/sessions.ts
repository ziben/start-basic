import { createFileRoute } from '@tanstack/react-router'

interface SessionInfo {
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

export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        console.info('Fetching sessions... @', request.url)
    
        // 模拟会话数据 - 实际应用中应从数据库获取
        const mockSessions: SessionInfo[] = [
          {
            id: 'sess_1',
            userId: '1',
            username: 'admin',
            email: 'admin@example.com',
            loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            isActive: true,
          },
          {
            id: 'sess_2',
            userId: '2',
            username: 'john_doe',
            email: 'john@example.com',
            loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            isActive: true,
          },
          {
            id: 'sess_3',
            userId: '3',
            username: 'jane_smith',
            email: 'jane@example.com',
            loginTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            isActive: false,
          },
        ]

        return Response.json(mockSessions)
      },
    }
  }
})
