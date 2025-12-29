import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTranslation } from './use-translation'

describe('useTranslation', () => {
  it('uses defaultMessage for unknown keys (no providers)', () => {
    const { result } = renderHook(() => useTranslation())
    expect(result.current.t('__missing.key__', { defaultMessage: 'fallback' })).toBe('fallback')
  })
})

