import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { messages, DEFAULT_LOCALE } from '~/i18n'

const resources = {
  en: { translation: messages.en },
  zh: { translation: messages.zh },
}

const setHtmlLang = (lang: string) => {
  if (typeof document !== 'undefined') {
    try {
      document.documentElement.setAttribute('lang', lang)
    } catch (e) {
      // ignore
    }
  }
}

// Initialize i18next for React, with browser language detector.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
  })

// ensure html lang is set to initial language
setHtmlLang(i18n.language || DEFAULT_LOCALE)

// when language changes, update html lang
i18n.on('languageChanged', (lng) => setHtmlLang(lng))

export default i18n
export { setHtmlLang }
