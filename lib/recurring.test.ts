import { describe, it, expect } from 'vitest'
import {
  ordinal,
  describeDueDay,
  occurrenceInMonth,
  monthKey,
  paymentTiming,
} from './recurring'

describe('ordinal', () => {
  it('uses st, nd, rd, th', () => {
    expect([1, 2, 3, 4, 5].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '5th'])
  })

  it('handles the 11 to 13 exceptions', () => {
    expect([11, 12, 13].map(ordinal)).toEqual(['11th', '12th', '13th'])
  })

  it('handles the twenties and thirties', () => {
    expect([21, 22, 23, 30, 31].map(ordinal)).toEqual(['21st', '22nd', '23rd', '30th', '31st'])
  })
})

describe('describeDueDay', () => {
  it('reads as a monthly repetition', () => {
    expect(describeDueDay(5)).toBe('5th of every month')
    expect(describeDueDay(1)).toBe('1st of every month')
  })
})

describe('occurrenceInMonth', () => {
  it('lands on the due day of the current month', () => {
    expect(occurrenceInMonth(5, '2026-08-20')).toBe('2026-08-05')
  })

  it('clamps to the last day of a short month', () => {
    expect(occurrenceInMonth(31, '2026-02-10')).toBe('2026-02-28')
    expect(occurrenceInMonth(31, '2026-04-10')).toBe('2026-04-30')
  })

  it('respects a leap February', () => {
    expect(occurrenceInMonth(30, '2028-02-01')).toBe('2028-02-29')
  })

  it('pads single digit days and months', () => {
    expect(occurrenceInMonth(5, '2026-01-31')).toBe('2026-01-05')
  })
})

describe('monthKey', () => {
  it('returns the first of the month', () => {
    expect(monthKey('2026-08-27')).toBe('2026-08-01')
  })
})

describe('paymentTiming', () => {
  const base = { due_day: 5, end_date: '2030-01-01', paid_month: null as string | null }

  it('is upcoming before the due day', () => {
    const t = paymentTiming(base, '2026-08-03')
    expect(t.occurrence).toBe('2026-08-05')
    expect(t.paid).toBe(false)
    expect(t.overdue).toBe(false)
  })

  it('is not overdue on the due day itself', () => {
    expect(paymentTiming(base, '2026-08-05').overdue).toBe(false)
  })

  it('is overdue once the due day has passed unpaid', () => {
    expect(paymentTiming(base, '2026-08-06').overdue).toBe(true)
  })

  it('counts as paid when settled for the current month', () => {
    const t = paymentTiming({ ...base, paid_month: '2026-08-01' }, '2026-08-20')
    expect(t.paid).toBe(true)
    expect(t.overdue).toBe(false)
  })

  it('clears the paid flag once the month rolls over', () => {
    // Paid for August; in September it is owed again.
    const t = paymentTiming({ ...base, paid_month: '2026-08-01' }, '2026-09-10')
    expect(t.paid).toBe(false)
    expect(t.overdue).toBe(true)
  })

  it('stops being owed after the end date', () => {
    const t = paymentTiming({ ...base, end_date: '2026-07-31' }, '2026-08-20')
    expect(t.ended).toBe(true)
    expect(t.overdue).toBe(false)
  })

  it('treats a 31st due day as the last day of a short month, not as overdue', () => {
    const short = { ...base, due_day: 31 }
    // 28 Feb IS February's occurrence, so it is due today rather than late.
    expect(paymentTiming(short, '2026-02-28').occurrence).toBe('2026-02-28')
    expect(paymentTiming(short, '2026-02-28').overdue).toBe(false)
    // Crossing into March starts a fresh cycle due on the 31st.
    expect(paymentTiming(short, '2026-03-01').occurrence).toBe('2026-03-31')
    expect(paymentTiming(short, '2026-03-01').overdue).toBe(false)
  })

  it('is overdue mid-month once an ordinary due day has passed', () => {
    expect(paymentTiming({ ...base, due_day: 15 }, '2026-02-20').overdue).toBe(true)
  })
})
