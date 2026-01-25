import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTranslation } from './use-translation'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('~/shared/context/locale-context', () => ({
  useOptionalLocale: () => null,
}))

describe('useTranslation', () => {
  it('uses defaultMessage for unknown keys (no providers)', () => {
    const { result } = renderHook(() => useTranslation())
    expect(result.current.t('__missing.key__', { defaultMessage: 'fallback' })).toBe('fallback')
  })
})

