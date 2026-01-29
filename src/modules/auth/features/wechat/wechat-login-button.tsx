/**
 * WeChat Login Button Component
 *
 * 使用 Better-Auth 的 genericOAuth 插件实现微信登录
 * Better-Auth 会自动处理 OAuth 流程，包括跳转和回调
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { authClient } from '../../shared/lib/auth-client'

interface WeChatLoginButtonProps {
    /** 登录成功后的回调 URL */
    callbackUrl?: string
    /** 登录失败后的回调 */
    onError?: (error: Error) => void
    /** 按钮文案 */
    children?: React.ReactNode
    /** 按钮样式变体 */
    variant?: 'default' | 'outline' | 'ghost'
    /** 按钮大小 */
    size?: 'default' | 'sm' | 'lg'
    /** 是否禁用 */
    disabled?: boolean
    /** 额外的 CSS 类名 */
    className?: string
}

export function WeChatLoginButton({
    callbackUrl,
    onError,
    children,
    variant = 'outline',
    size = 'default',
    disabled = false,
    className,
}: WeChatLoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = useCallback(async () => {
        setIsLoading(true)

        try {
            // 使用 Better-Auth 的 genericOAuth 登录
            // 这会自动处理 OAuth 流程，包括跳转和回调
            await authClient.signIn.oauth2({
                providerId: 'wechat',
                callbackURL: callbackUrl || '/',
            })
        } catch (error) {
            console.error('[WeChatLogin] Failed to initiate login:', error)
            onError?.(error instanceof Error ? error : new Error('Failed to initiate WeChat login'))
            setIsLoading(false)
        }
    }, [callbackUrl, onError])

    return (
        <Button
            variant={variant}
            size={size}
            disabled={disabled || isLoading}
            onClick={handleLogin}
            className={className}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children || (
                <>
                    <WeChatIcon className="mr-2 h-4 w-4" />
                    微信登录
                </>
            )}
        </Button>
    )
}

/**
 * 微信图标组件
 */
export function WeChatIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.238 18.423 24 16.892 24 15.18c0-3.37-3.303-6.269-7.062-6.322zM14.02 13.45c.534 0 .966.44.966.981a.974.974 0 0 1-.966.981.976.976 0 0 1-.967-.981c0-.541.433-.981.967-.981zm4.859 0c.534 0 .966.44.966.981a.974.974 0 0 1-.966.981.976.976 0 0 1-.967-.981c0-.541.433-.981.967-.981z" />
        </svg>
    )
}
