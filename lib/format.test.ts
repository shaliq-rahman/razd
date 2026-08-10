import { describe, it, expect } from 'vitest'
import {
  formatAmountInput,
  formatDayLabel,
  formatINR,
  formatSignedINR,
  normalizeAmountInput,
} from './format'

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

describe('editable amount formatting', () => {
  it.each([
    ['100', '100'],
    ['1000', '1,000'],
    ['10000', '10,000'],
    ['100000', '1,00,000'],
    ['12345678.5', '1,23,45,678.5'],
  ])('groups %s using the Indian number system', (value, expected) => {
    expect(formatAmountInput(value)).toBe(expected)
  })

  it('keeps a trailing decimal point while the user is typing', () => {
    expect(formatAmountInput('1000.')).toBe('1,000.')
  })

  it('normalizes pasted commas and limits paise to two digits', () => {
    expect(normalizeAmountInput('₹1,23,456.789')).toBe('123456.78')
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
