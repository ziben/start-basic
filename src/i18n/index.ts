import en from './locales/en'
import zh from './locales/zh'

export const LOCALES = {
  en: 'en',
  zh: 'zh',
} as const

export type LocaleType = keyof typeof LOCALES

export const DEFAULT_LOCALE: LocaleType = 'zh'

export const LOCALE_NAMES = {
  [LOCALES.en]: 'English',
  [LOCALES.zh]: '中文',
} as const

export const messages = {
  [LOCALES.en]: en,
  [LOCALES.zh]: zh,
} as const

// 递归设置所有嵌套消息的类型
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T
export type IntlMessages = typeof en
export type PartialIntlMessages = DeepPartial<IntlMessages>
