import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { DEFAULT_LOCALE, LocaleType, LOCALES, messages } from '~/i18n'

interface LocaleContextType {
  locale: LocaleType
  setLocale: (locale: LocaleType) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

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

  const setLocale = (locale: LocaleType) => {
    if (isBrowser) {
      try {
        localStorage.setItem('locale', locale)
      } catch (e) {
        console.error('Failed to save locale to localStorage:', e)
      }
    }
    _setLocale(locale)
    
    // 可选：设置 HTML lang 属性
    if (isBrowser) {
      document.documentElement.setAttribute('lang', locale)
    }
  }

  // 初始化时设置 HTML lang 属性
  useEffect(() => {
    if (isBrowser) {
      document.documentElement.setAttribute('lang', locale)
    }
  }, [locale])

  // 扁平化消息对象
  const flatMessages = flattenMessages(messages[locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
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