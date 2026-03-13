const SAFE_REDIRECT_BASE = 'https://app.local'

export function sanitizeRedirectTarget(redirectTo?: string | null): string | undefined {
  if (!redirectTo) return undefined

  const trimmed = redirectTo.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return undefined
  }

  try {
    const url = new URL(trimmed, SAFE_REDIRECT_BASE)
    if (url.origin !== SAFE_REDIRECT_BASE) {
      return undefined
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

export function resolveRedirectTarget(redirectTo: string | null | undefined, fallback: string): string {
  return sanitizeRedirectTarget(redirectTo) ?? fallback
}
