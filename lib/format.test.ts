import { describe, it, expect } from 'vitest'
import { formatINR, formatSignedINR, formatDayLabel } from './format'

describe('formatINR', () => {
  it('formats with Indian digit grouping', () => {
    expect(formatINR(123456)).toBe('₹1,23,456.00')
  })

  it('formats a value above one crore', () => {
    expect(formatINR(12345678.5)).toBe('₹1,23,45,678.50')
  })

  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0.00')
  })

  it('formats a negative total with the sign before the symbol', () => {
    expect(formatINR(-2500)).toBe('-₹2,500.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatINR(99.999)).toBe('₹100.00')
  })
})

describe('formatSignedINR', () => {
  it('prefixes income with a plus', () => {
    expect(formatSignedINR(500, 'income')).toBe('+₹500.00')
  })

  it('prefixes expense with a minus', () => {
    expect(formatSignedINR(500, 'expense')).toBe('-₹500.00')
  })
})

describe('formatDayLabel', () => {
  const today = new Date('2026-08-07T10:00:00')

  it('labels today', () => {
    expect(formatDayLabel('2026-08-07', today)).toBe('Today')
  })

  it('labels yesterday', () => {
    expect(formatDayLabel('2026-08-06', today)).toBe('Yesterday')
  })

  it('formats older dates as day and month', () => {
    expect(formatDayLabel('2026-07-30', today)).toBe('30 Jul 2026')
  })
})
