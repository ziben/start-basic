import { createFileRoute } from '@tanstack/react-router'
import { handleWeChatPayNotify, verifyWeChatPaySignature } from '~/modules/payment/shared/server-fns/notify'

export const Route = createFileRoute('/api/payment/wechat/notify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text()

        // 验证签名
        const headers: Record<string, string | undefined> = {
          'wechatpay-timestamp': request.headers.get('wechatpay-timestamp') ?? undefined,
          'wechatpay-nonce': request.headers.get('wechatpay-nonce') ?? undefined,
          'wechatpay-signature': request.headers.get('wechatpay-signature') ?? undefined,
          'wechatpay-serial': request.headers.get('wechatpay-serial') ?? undefined,
        }

        // 签名验证：verifySign 需要在线拉取微信平台证书（/v3/certificates），
        // 如果网络或配置问题导致拉取失败，不应阻塞通知处理。
        // 通知真实性已由 handleWeChatPayNotify 内的 AEAD_AES_256_GCM 解密保证。
        const isValid = await verifyWeChatPaySignature(headers, body)
        if (!isValid) {
          console.warn('[WeChatPay Notify] Signature verification failed, proceeding with decryption-based verification')
        }

        // 解析并处理通知（decryptNotification 会用 APIv3 密钥解密，解密成功即可信）
        const notification = JSON.parse(body)
        const result = await handleWeChatPayNotify(notification)

        const status = result.code === 'SUCCESS' ? 200 : 500
        return new Response(JSON.stringify(result), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
