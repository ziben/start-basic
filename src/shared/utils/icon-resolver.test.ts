import { describe, expect, it } from 'vitest'
import { iconResolver, toKebabIconName, toPascalIconName } from './icon-resolver'

describe('icon resolver', () => {
  it('normalizes database and dynamic icon names', () => {
    expect(toKebabIconName('ArrowRight')).toBe('arrow-right')
    expect(toKebabIconName('arrow_right')).toBe('arrow-right')
    expect(toPascalIconName('arrow-right')).toBe('ArrowRight')
    expect(iconResolver('ArrowRight')).toBeDefined()
    expect(iconResolver('not-a-real-icon')).toBeUndefined()
  })
})
