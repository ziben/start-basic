import { useIntl } from 'react-intl'
import { useLocale } from '~/context/locale-context'
import { DEFAULT_LOCALE, LocaleType, messages } from '~/i18n'

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
      return Object.entries(values).reduce((str, [key, value]) => {
        return str.replace(new RegExp(`{${key}}`, 'g'), String(value))
      }, result)
    }

    return result
  } catch (e) {
    return id // 出错时直接返回原始ID
  }
}

export const useTranslation = () => {
  let intl: ReturnType<typeof useIntl> | null = null
  let locale = DEFAULT_LOCALE
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

  // 如果有intl上下文，使用intl的formatMessage，否则使用fallback
  const t = (id: string, values?: Record<string, any>): string => {
    if (intl) {
      return intl.formatMessage({ id }, values)
    }
    return safeFallbackTranslate(id, locale, values)
  }

  return {
    t,
    locale,
    setLocale: setLocale || (() => {}),
    intl,
  }
}
