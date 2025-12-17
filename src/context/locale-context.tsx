import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { DEFAULT_LOCALE, LocaleType, LOCALES, messages } from '~/i18n'
import i18n from '~/i18n/i18n'

interface LocaleContextType {
  locale: LocaleType
  setLocale: (locale: LocaleType) => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

// 检测是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 将嵌套的消息对象扁平化为 Record<string, string> 格式
const flattenMessages = (nestedMessages: any, prefix = ''): Record<string, string> => {
  return Object.keys(nestedMessages).reduce((acc, key) => {
    const value = nestedMessages[key]
    const prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      acc[prefixedKey] = value
    } else {
      Object.assign(acc, flattenMessages(value, prefixedKey))
    }

    return acc
  }, {} as Record<string, string>)
}

// 安全地从localStorage获取语言设置
const getSavedLocale = (): LocaleType => {
  if (!isBrowser) {
    return DEFAULT_LOCALE
  }
  
  try {
    const savedLocale = localStorage.getItem('locale')
    return (savedLocale === LOCALES.en || savedLocale === LOCALES.zh) 
      ? savedLocale 
      : DEFAULT_LOCALE
  } catch (e) {
    return DEFAULT_LOCALE
  }
}

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  // 从本地存储中获取语言设置，如果没有则使用默认语言
  const [locale, _setLocale] = useState<LocaleType>(getSavedLocale)

  const setLocale = useCallback((locale: LocaleType) => {
    if (isBrowser) {
      try {
        localStorage.setItem('locale', locale)
      } catch (e) {
        console.error('Failed to save locale to localStorage:', e)
      }
    }
    _setLocale(locale)
    
    // 同步到 i18next
    try {
      i18n.changeLanguage(locale)
    } catch (e) {
      // ignore if i18n not initialized
    }
  }, [])

  // 初始化时设置 HTML lang 属性
  // i18next 初始化和 languageChanged 事件会设置 HTML lang；保留空的 effect to keep SSR-safety
  useEffect(() => {
    if (!isBrowser) return
    // no-op: i18n handles html lang
  }, [locale])

  // 扁平化消息对象
  const flatMessages = useMemo(() => flattenMessages(messages[locale]), [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider 
        locale={locale} 
        messages={flatMessages} 
        defaultLocale={DEFAULT_LOCALE}
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  )
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
} 