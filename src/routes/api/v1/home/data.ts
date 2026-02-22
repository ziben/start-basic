import { createFileRoute } from '@tanstack/react-router'
import { getRuntimeConfig } from '~/shared/config/runtime-config'
import db from '~/shared/lib/db'

export const Route = createFileRoute('/api/v1/home/data')({
    server: {
        handlers: {
            GET: async () => {
                try {
                    // You could tailor this data exactly for the Flutter App
                    // Example: Latest announcements, featured products, etc.

                    // 1. Get mobile home layout config (if any) from system config
                    const mobileHomeConfig = getRuntimeConfig('homeRoute_mobile') || '/m'

                    // 2. Mock or fetch real resources
                    // e.g. Recent posts/announcements
                    const posts = await db.post.findMany({
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        select: { id: true, title: true, summary: true, createdAt: true },
                    })

                    const homeData = {
                        bannerUrls: [
                            'https://picsum.photos/seed/slide1/800/400',
                            'https://picsum.photos/seed/slide2/800/400'
                        ],
                        layout: mobileHomeConfig,
                        recentPosts: posts,
                        quickLinks: [
                            { id: 'ai', title: 'AI Assistant', icon: 'Bot' },
                            { id: 'payment', title: 'Top-up center', icon: 'CreditCard' },
                            { id: 'profile', title: 'My Profile', icon: 'User' }
                        ]
                    }

                    return new Response(JSON.stringify(homeData), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    })
                } catch (error: any) {
                    console.error('[API home data error]:', error)
                    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            },
        },
    },
})
