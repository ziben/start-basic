import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { DEFAULT_LOCALE, LocaleType, LOCALES } from '~/i18n'
import i18n from '~/i18n/i18n'

interface LocaleContextType {
  locale: LocaleType
  setLocale: (locale: LocaleType) => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

// 检测是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 安全地从localStorage获取语言设置
const getSavedLocale = (): LocaleType => {
  if (!isBrowser) {
    return DEFAULT_LOCALE
  }

  try {
    const savedLocale = localStorage.getItem('locale')
    return savedLocale === LOCALES.en || savedLocale === LOCALES.zh ? savedLocale : DEFAULT_LOCALE
  } catch {
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
      } catch {
        console.error('Failed to save locale to localStorage')
      }
    }
    _setLocale(locale)

    // 同步到 i18next
    try {
      i18n.changeLanguage(locale)
    } catch {
      // ignore if i18n not initialized
    }
  }, [])

  // 初始化时设置 HTML lang 属性
  // i18next 初始化和 languageChanged 事件会设置 HTML lang；保留空的 effect to keep SSR-safety
  useEffect(() => {
    if (!isBrowser) return
    // no-op: i18n handles html lang
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useOptionalLocale = () => {
  return useContext(LocaleContext)
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

