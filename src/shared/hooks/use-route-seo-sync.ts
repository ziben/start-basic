import * as React from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import { useRouterState } from '@tanstack/react-router'
import { composeSeoDescription, composeSeoTitle } from '@/shared/utils/seo'
import { useSeoConfig } from '@/shared/context/seo-config-context'
import { deriveRouteSeoConfig } from '@/shared/utils/route-seo'

export function useRouteSeoSync(): void {
  const { t: rawT } = useI18nextTranslation()
  const state = useRouterState()
  const seoConfig = useSeoConfig()

  const pathname = state.location.pathname

  React.useEffect(() => {
    if (typeof document === 'undefined') return

    const cfg = deriveRouteSeoConfig(pathname)

    const pageTitle = cfg?.pageTitleKey
      ? String(rawT(String(cfg.pageTitleKey), { defaultValue: cfg.fallbackTitle ?? 'App' }))
      : (cfg?.fallbackTitle ?? 'App')

    const pageDesc = cfg?.pageDescKey ? String(rawT(String(cfg.pageDescKey))) : cfg?.fallbackDescription

    const title = composeSeoTitle({ pageTitle }, seoConfig)
    const description = composeSeoDescription({ pageDesc }, seoConfig)

    if (title) document.title = title

    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'description')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', description)
    }
  }, [rawT, pathname, seoConfig])
}
