import { useIntl } from 'react-intl'
import { useLocale } from '~/context/locale-context'
import { DEFAULT_LOCALE, LocaleType, messages } from '~/i18n'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import i18n from '~/i18n/i18n'

// 安全翻译函数，在IntlProvider上下文不可用时降级使用基本翻译查找
const safeFallbackTranslate = (
  id: string,
  locale: LocaleType = DEFAULT_LOCALE,
  values?: Record<string, any>
): string => {
  try {
    // 解析嵌套路径，如 "settings.account.title"
    const keys = id.split('.')
    let result = messages[locale]

    for (const key of keys) {
      if (!result || typeof result !== 'object') return id
      result = (result as any)[key]
    }

    if (typeof result !== 'string') return id

    // 简单替换参数，不支持复杂的ICU格式
    if (values) {
      // types are tricky with reduce here; use a simple loop and ensure string typing
      let out = String(result)
      for (const [key, value] of Object.entries(values)) {
        out = out.replace(new RegExp(`{${key}}`, 'g'), String(value))
      }
      return out
    }

    return result
  } catch (e) {
    return id // 出错时直接返回原始ID
  }
}

export const useTranslation = () => {
  // 优先使用 react-i18next 的 hook
  let i18nT: ((key: string, vars?: Record<string, any>) => string) | null = null
  let i18nLocale: LocaleType = DEFAULT_LOCALE
  try {
    const { t, i18n: i18nInstance } = useI18nextTranslation()
    i18nT = (key: string, vars?: Record<string, any>) => {
      const res = t(key, vars as any)
      return typeof res === 'string' ? res : String(res)
    }
    i18nLocale = (i18nInstance.language || DEFAULT_LOCALE) as LocaleType
  } catch (e) {
    // not in react-i18next context
  }

  let intl: ReturnType<typeof useIntl> | null = null
  let locale = i18nLocale
  let setLocale: ((locale: LocaleType) => void) | null = null

  // 尝试使用react-intl的hook，如果不在上下文中则忽略错误
  try {
    intl = useIntl()
  } catch (e) {
    // 当不在IntlProvider上下文中时，intl将为null
  }

  // 尝试使用locale context，如果不在上下文中则忽略错误
  try {
    const localeContext = useLocale()
    locale = localeContext.locale
    setLocale = localeContext.setLocale
  } catch (e) {
    // 当不在LocaleProvider上下文中时，使用默认值
  }

  type TOptions = Record<string, any> | { defaultMessage?: string } & Record<string, any>

  const t = (id: string, values?: TOptions): string => {
    // extract defaultMessage if provided
    let defaultMessage: string | undefined = undefined
    let actualValues: Record<string, any> | undefined = undefined
    if (values) {
      if (typeof (values as any).defaultMessage === 'string') {
        defaultMessage = (values as any).defaultMessage
        // remove defaultMessage from values for interpolation
        const { defaultMessage: _dm, ...rest } = values as any
        actualValues = Object.keys(rest).length ? (rest as Record<string, any>) : undefined
      } else {
        actualValues = values as Record<string, any>
      }
    }

    // 优先用 react-i18next
    if (i18nT) {
      const res = i18nT(id, actualValues)
      if (res && res !== id) return res
      if (defaultMessage) return defaultMessage
      return res
    }

    // 否则，如果有intl上下文，用react-intl
    if (intl) {
      try {
        return intl.formatMessage({ id, defaultMessage: defaultMessage }, actualValues)
      } catch (e) {
        // fallthrough to fallback
      }
    }

    // 最后回退到本地 messages
    const fallback = safeFallbackTranslate(id, locale, actualValues)
    if ((fallback === id || !fallback) && defaultMessage) return defaultMessage
    return fallback
  }

  const setLocaleWrapper = (lng: LocaleType) => {
    // 同步本地 context
    if (setLocale) setLocale(lng)
    // 同步 i18next
    try {
      i18n.changeLanguage(lng)
    } catch (e) {
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
