import { describe, expect, it } from 'vitest'
import { cardAlertClass, isMinimumDueCovered } from './card-alert'

describe('cardAlertClass', () => {
  it('does not alert below ₹10,000', () => {
    expect(cardAlertClass(9_999.99)).toBe('')
  })

  it('uses yellow from ₹10,000', () => {
    expect(cardAlertClass(10_000)).toContain('card-alert-yellow')
  })

  it('uses orange from ₹20,000', () => {
    expect(cardAlertClass(20_000)).toContain('card-alert-orange')
  })

  it('uses red from ₹30,000', () => {
    expect(cardAlertClass(30_000)).toContain('card-alert-red')
  })
})

describe('isMinimumDueCovered', () => {
  it('covers the paid month and the following month until its due date', () => {
    expect(isMinimumDueCovered('2026-08-01', 18, '2026-08-31')).toBe(true)
    expect(isMinimumDueCovered('2026-08-01', 18, '2026-09-17')).toBe(true)
    expect(isMinimumDueCovered('2026-08-01', 18, '2026-09-18')).toBe(false)
  })

  it('does not carry into another month without a due day', () => {
    expect(isMinimumDueCovered('2026-08-01', null, '2026-09-01')).toBe(false)
  })
})
