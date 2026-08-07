import { describe, it, expect } from 'vitest'
import { sumAmounts } from './money'

describe('sumAmounts', () => {
  it('returns zero for an empty list', () => {
    expect(sumAmounts([])).toBe(0)
  })

  it('adds whole rupee amounts', () => {
    expect(sumAmounts([1500, 2500])).toBe(4000)
  })

  it('handles negative amounts such as an overdrawn card', () => {
    expect(sumAmounts([5000, -1200])).toBe(3800)
  })

  it('avoids floating point drift on paise', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
  })

  it('avoids drift across many fractional amounts', () => {
    expect(sumAmounts(Array(10).fill(0.1))).toBe(1)
  })
})
