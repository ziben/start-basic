import { useIntl } from 'react-intl'
import { useLocale } from '~/context/locale-context'
import { DEFAULT_LOCALE, LocaleType, messages } from '~/i18n'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import i18n from '~/i18n/i18n'

// 安全翻译函数，在IntlProvider上下文不可用时降级使用基本翻译查找
const safeFallbackTranslate = (
  id: string,
  locale: LocaleType = DEFAULT_LOCALE,
  values?: Record<string, unknown>
): string => {
  try {
    const keys = id.split('.')
    let result: unknown = messages[locale]

    for (const key of keys) {
      if (!result || typeof result !== 'object') return id
      result = (result as Record<string, unknown>)[key]
    }

    if (typeof result !== 'string') return id

    if (values) {
      let out = String(result)
      for (const [key, value] of Object.entries(values)) {
        out = out.replace(new RegExp(`{${key}}`, 'g'), String(value))
      }
      return out
    }

    return result
  } catch {
    return id
  }
}

export const useTranslation = () => {
  let i18nT: ((key: string, vars?: Record<string, unknown>) => string) | null = null
  let i18nLocale: LocaleType = DEFAULT_LOCALE
  try {
    const { t, i18n: i18nInstance } = useI18nextTranslation()
    i18nT = (key: string, vars?: Record<string, unknown>) => {
      const res = t(key, vars as Record<string, string>)
      return typeof res === 'string' ? res : String(res)
    }
    i18nLocale = (i18nInstance.language || DEFAULT_LOCALE) as LocaleType
  } catch {
    // not in react-i18next context
  }

  let intl: ReturnType<typeof useIntl> | null = null
  let locale = i18nLocale
  let setLocale: ((locale: LocaleType) => void) | null = null

  try {
    intl = useIntl()
  } catch {
    // 当不在IntlProvider上下文中时，intl将为null
  }

  try {
    const localeContext = useLocale()
    locale = localeContext.locale
    setLocale = localeContext.setLocale
  } catch {
    // 当不在LocaleProvider上下文中时，使用默认值
  }

  type TOptions = Record<string, unknown> | { defaultMessage?: string } & Record<string, unknown>

  const t = (id: string, values?: TOptions): string => {
    let defaultMessage: string | undefined = undefined
    let actualValues: Record<string, unknown> | undefined = undefined
    if (values) {
      if (typeof (values as { defaultMessage?: string }).defaultMessage === 'string') {
        defaultMessage = (values as { defaultMessage: string }).defaultMessage
        const { defaultMessage: _dm, ...rest } = values as { defaultMessage: string } & Record<string, unknown>
        actualValues = Object.keys(rest).length ? rest : undefined
      } else {
        actualValues = values as Record<string, unknown>
      }
    }

    if (i18nT) {
      const res = i18nT(id, actualValues)
      if (res && res !== id) return res
      if (defaultMessage) return defaultMessage
      return res
    }

    if (intl) {
      try {
        return intl.formatMessage({ id, defaultMessage: defaultMessage }, actualValues)
      } catch {
        // fallthrough to fallback
      }
    }

    const fallback = safeFallbackTranslate(id, locale, actualValues)
    if ((fallback === id || !fallback) && defaultMessage) return defaultMessage
    return fallback
  }

  const setLocaleWrapper = (lng: LocaleType) => {
    if (setLocale) setLocale(lng)
    try {
      i18n.changeLanguage(lng)
    } catch {
      // ignore
    }
  }

  return {
    t,
    locale,
    setLocale: setLocaleWrapper,
    intl,
  }
}
