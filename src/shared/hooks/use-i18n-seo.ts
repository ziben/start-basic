import * as React from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import { composeSeoDescription, composeSeoTitle, seo } from '@/shared/utils/seo'
import { DEFAULT_LOCALE, LOCALES, messages, type LocaleType } from '~/i18n'
import { useOptionalLocale } from '~/shared/context/locale-context'

type BundledMessages = Record<string, unknown>

const getBundledLocale = (): LocaleType => {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const lang = document.documentElement.getAttribute('lang')
  if (lang === LOCALES.en) return LOCALES.en
  if (lang === LOCALES.zh) return LOCALES.zh
  return DEFAULT_LOCALE
}

const getBundledMessage = (locale: LocaleType, id: string): string | undefined => {
  const keys = id.split('.')
  let node: unknown = messages[locale] as unknown

  for (const key of keys) {
    if (!node || typeof node !== 'object') return undefined
    node = (node as BundledMessages)[key]
  }

  return typeof node === 'string' ? node : undefined
}

export const createI18nSeoHead = (opts: {
  titleKey?: string
  descriptionKey?: string
  pageTitleKey?: string
  pageDescKey?: string
  fallbackTitle?: string
  fallbackDescription?: string
}): (() => { meta: ReturnType<typeof seo> }) => {
  return (): { meta: ReturnType<typeof seo> } => {
    const locale = getBundledLocale()
    const titleKey = opts.pageTitleKey ?? opts.titleKey
    const descKey = opts.pageDescKey ?? opts.descriptionKey

    const pageTitle = (titleKey ? getBundledMessage(locale, titleKey) : undefined) ?? opts.fallbackTitle ?? 'App'
    const pageDesc =
      ((descKey ? getBundledMessage(locale, descKey) : undefined) ?? opts.fallbackDescription) || undefined

    const title = composeSeoTitle({ pageTitle })
    const description = composeSeoDescription({ pageDesc })

    return {
      meta: [
        ...seo({
          title,
          description,
        }),
      ],
    }
  }
}

export const useI18nSeoSync = (opts: {
  titleKey?: string
  descriptionKey?: string
  pageTitleKey?: string
  pageDescKey?: string
  fallbackTitle?: string
}): void => {
  const { t: rawT, i18n: i18nInstance } = useI18nextTranslation()
  const localeContext = useOptionalLocale()

  const locale = (localeContext?.locale || i18nInstance.language || DEFAULT_LOCALE) as LocaleType

  React.useEffect(() => {
    if (typeof document === 'undefined') return

    const titleKey = opts.pageTitleKey ?? opts.titleKey
    const descKey = opts.pageDescKey ?? opts.descriptionKey

    const pageTitle = titleKey
      ? String(rawT(String(titleKey), { defaultValue: opts.fallbackTitle ?? 'App' }))
      : (opts.fallbackTitle ?? 'App')
    const pageDesc = descKey ? String(rawT(String(descKey))) : ''

    const title = composeSeoTitle({ pageTitle })
    const description = composeSeoDescription({ pageDesc: pageDesc || undefined }) ?? ''

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
  }, [rawT, locale, opts.titleKey, opts.descriptionKey, opts.pageTitleKey, opts.pageDescKey, opts.fallbackTitle])
}

export const withI18nSeoSync = <P extends object>(
  Component: React.ComponentType<P>,
  opts: {
    titleKey?: string
    descriptionKey?: string
    pageTitleKey?: string
    pageDescKey?: string
    fallbackTitle?: string
  }
) => {
  return function I18nSeoSyncedComponent(props: P): React.ReactElement {
    useI18nSeoSync(opts)
    return React.createElement(Component, props)
  }
}
