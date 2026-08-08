import { describe, expect, it } from 'vitest'
import { cardAlertClass } from './card-alert'

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
