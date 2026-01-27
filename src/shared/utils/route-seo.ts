export type RouteSeoConfig = {
  pageTitleKey?: string
  pageDescKey?: string
  fallbackTitle?: string
  fallbackDescription?: string
}

const toBaseKeyFromPathname = (pathname: string): string | undefined => {
  const parts = pathname
    .split('/')
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !x.startsWith('_'))

  if (parts.length === 0) return undefined
  return parts.join('.')
}

export const deriveRouteSeoConfig = (pathname: string): RouteSeoConfig => {
  const baseKey = toBaseKeyFromPathname(pathname)

  if (!baseKey) {
    return {}
  }

  return {
    pageTitleKey: `${baseKey}.title`,
    pageDescKey: `${baseKey}.desc`,
  }
}
