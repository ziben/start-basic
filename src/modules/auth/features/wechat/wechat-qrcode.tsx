/**
 * WeChat QR Code Component
 *
 * 使用微信官方 JS SDK 渲染扫码登录二维码
 *
 * @see https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'

interface WeChatQRCodeProps {
    /** 微信开放平台 AppID */
    appId: string
    /** 授权回调地址 */
    redirectUri: string
    /** 扫码成功回调 (获取到 code) */
    onSuccess?: (code: string) => void
    /** 扫码失败回调 */
    onError?: (error: Error) => void
    /** 二维码容器宽度 */
    width?: number
    /** 二维码容器高度 */
    height?: number
    /** 自定义样式链接 */
    href?: string
    /** 额外的 CSS 类名 */
    className?: string
}

// 声明微信 JS SDK 全局对象
declare global {
    interface Window {
        WxLogin?: new (options: {
            self_redirect?: boolean
            id: string
            appid: string
            scope: string
            redirect_uri: string
            state?: string
            style?: string
            href?: string
        }) => void
    }
}

/**
 * 微信扫码登录二维码组件
 *
 * 使用微信官方提供的 JS SDK 渲染二维码
 * 用户扫码后会跳转到 redirectUri 并携带 code 参数
 */
export function WeChatQRCode({
    appId,
    redirectUri,
    onSuccess,
    onError,
    width = 300,
    height = 400,
    href,
    className,
}: WeChatQRCodeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const containerId = useRef(`wechat-qr-${Math.random().toString(36).substring(2, 9)}`)

    // 加载微信 JS SDK
    const loadWxLoginScript = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            if (window.WxLogin) {
                resolve()
                return
            }

            const script = document.createElement('script')
            script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js'
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load WeChat login script'))
            document.head.appendChild(script)
        })
    }, [])

    // 初始化二维码
    useEffect(() => {
        let mounted = true

        const initQRCode = async () => {
            try {
                await loadWxLoginScript()

                if (!mounted || !containerRef.current) return

                // 生成随机 state
                const state = Math.random().toString(36).substring(2, 15)

                // 创建微信登录对象
                new window.WxLogin!({
                    self_redirect: false,
                    id: containerId.current,
                    appid: appId,
                    scope: 'snsapi_login',
                    redirect_uri: encodeURIComponent(redirectUri),
                    state,
                    style: 'black',
                    href: href || undefined,
                })

                // 监听 iframe 消息 (用于内嵌模式)
                const handleMessage = (event: MessageEvent) => {
                    if (event.origin !== 'https://open.weixin.qq.com') return

                    try {
                        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
                        if (data.code) {
                            onSuccess?.(data.code)
                        }
                    } catch {
                        // 忽略非 JSON 消息
                    }
                }

                window.addEventListener('message', handleMessage)

                return () => {
                    window.removeEventListener('message', handleMessage)
                }
            } catch (error) {
                console.error('[WeChatQRCode] Failed to initialize:', error)
                onError?.(error instanceof Error ? error : new Error('Failed to initialize WeChat QR code'))
            }
        }

        initQRCode()

        return () => {
            mounted = false
        }
    }, [appId, redirectUri, href, loadWxLoginScript, onSuccess, onError])

    return (
        <div
            ref={containerRef}
            id={containerId.current}
            className={cn('flex items-center justify-center overflow-hidden rounded-lg bg-white', className)}
            style={{ width, height }}
        />
    )
}

/**
 * 简化版二维码组件 (使用 QRCode 库生成)
 *
 * 如果不想依赖微信官方 JS SDK，可以使用第三方库生成授权 URL 的二维码
 */
export function WeChatQRCodeSimple({
    authUrl,
    size = 200,
    className,
}: {
    authUrl: string
    size?: number
    className?: string
}) {
    // 需要安装: pnpm add qrcode.react
    // import { QRCodeSVG } from 'qrcode.react'

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border bg-white p-4',
                className
            )}
        >
            <div
                className="flex items-center justify-center bg-gray-100"
                style={{ width: size, height: size }}
            >
                {/* 替换为真实的 QRCode 组件 */}
                {/* <QRCodeSVG value={authUrl} size={size} /> */}
                <p className="text-center text-xs text-muted-foreground">
                    安装 qrcode.react 后
                    <br />
                    可使用此组件
                </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">请使用微信扫描二维码</p>
        </div>
    )
}
