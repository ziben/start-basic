/**
 * WeChat Login Button Component
 *
 * 使用 Better-Auth 客户端 API 调用微信登录
 * 客户端插件自动推断服务端插件的类型
 */

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '../../shared/lib/auth-client'

interface WeChatLoginButtonProps {
    /** 登录成功后的回调 URL */
    callbackUrl?: string
    /** 登录失败后的回调 URL */
    errorCallbackUrl?: string
    /** 新用户回调 URL */
    newUserCallbackUrl?: string
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
    errorCallbackUrl,
    newUserCallbackUrl,
    onError,
    children,
    variant = 'outline',
    size = 'default',
    disabled = false,
    className,
}: WeChatLoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    // 监听 URL 中的错误参数，处理登录失败的情况
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        if (error) {
            // 重置加载状态
            setIsLoading(false)

            // 显示错误提示
            const errorMessage = getErrorMessage(error, errorDescription)
            toast.error('微信登录失败', {
                description: errorMessage,
            })

            // 触发错误回调
            if (onError) {
                onError(new Error(errorMessage))
            }

            // 清理 URL 中的错误参数
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('error')
            newUrl.searchParams.delete('error_description')
            window.history.replaceState({}, '', newUrl.toString())
        }
    }, [onError])

    const handleLogin = useCallback(async () => {
        setIsLoading(true)

        try {
            // 使用 Better-Auth 客户端 API
            // 服务端 /sign-in/wechat 自动转换为 signIn.wechat
            const response = await authClient.signIn.wechat({
                callbackURL: callbackUrl || '/',
                errorCallbackURL: errorCallbackUrl,
                newUserCallbackURL: newUserCallbackUrl,
                disableRedirect: false,
            })

            // 跳转到微信授权页面
            if (response.data?.url) {
                window.location.href = response.data.url
            } else {
                // 如果没有返回 URL，重置加载状态
                setIsLoading(false)
                toast.error('登录失败', {
                    description: '无法获取微信授权链接',
                })
            }
        } catch (error) {
            console.error('[WeChatLogin] Failed to initiate login:', error)
            setIsLoading(false)

            const errorMessage = error instanceof Error ? error.message : '启动微信登录失败'
            toast.error('登录失败', {
                description: errorMessage,
            })

            onError?.(error instanceof Error ? error : new Error(errorMessage))
        }
    }, [callbackUrl, errorCallbackUrl, newUserCallbackUrl, onError])

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

/**
 * 将微信登录错误代码转换为用户友好的错误消息
 */
function getErrorMessage(error: string, errorDescription?: string | null): string {
    // 优先使用错误描述
    if (errorDescription) {
        return errorDescription
    }

    // 错误代码映射
    const errorMessages: Record<string, string> = {
        access_denied: '用户拒绝授权',
        invalid_request: '登录请求无效',
        unauthorized_client: '客户端未授权',
        unsupported_response_type: '不支持的响应类型',
        invalid_scope: '请求的权限范围无效',
        server_error: '微信服务器错误',
        temporarily_unavailable: '微信服务暂时不可用',
        wechat_code_missing: '缺少微信授权码',
        wechat_token_error: '获取微信令牌失败',
        wechat_token_missing_fields: '微信令牌数据不完整',
        wechat_userinfo_invalid_json: '微信用户信息格式错误',
        wechat_userinfo_error: '获取微信用户信息失败',
    }

    return errorMessages[error] || `登录失败 (${error})`
}
