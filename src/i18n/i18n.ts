import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { messages, DEFAULT_LOCALE } from '~/i18n'

const resources = {
  en: { translation: messages.en },
  zh: { translation: messages.zh },
}

// Try to load remote locale resources (from backend DB) and merge into i18n at runtime
async function loadRemoteLocale(lng: string) {
  try {
    const resp = await fetch(`/api/i18n/${encodeURIComponent(lng)}`)
    if (!resp.ok) throw new Error('failed to fetch')
    const data = await resp.json()
    // merge into i18n resources
    i18n.addResourceBundle(lng, 'translation', data, true, true)
    return true
  } catch (e) {
    // fallback to bundled resources
    return false
  }
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

// When initialized, try to load remote bundle for initial language (best-effort).
loadRemoteLocale(i18n.language || DEFAULT_LOCALE).catch(() => {})

// when language changes, update html lang and try to load remote bundle for the new language
i18n.on('languageChanged', (lng) => {
  setHtmlLang(lng)
  loadRemoteLocale(lng).catch(() => {})
})

export default i18n
export { setHtmlLang }

