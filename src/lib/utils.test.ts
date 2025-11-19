import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('combines class names', () => {
    const result = cn('a', 'b', { hidden: false } as any)
    expect(typeof result).toBe('string')
  })
})
