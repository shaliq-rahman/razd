/**
 * Monthly commitments repeat on a day of the month — "the 5th of every month" —
 * rather than on one fixed calendar date. These helpers turn that day number
 * into concrete dates and a status for the current cycle.
 *
 * Everything here works on local YYYY-MM-DD strings. Date objects built from a
 * bare "YYYY-MM-DD" are parsed as UTC and shift backwards in IST, so dates are
 * never round-tripped through toISOString().
 */

/** "1st", "2nd", "3rd", "4th" … handling the 11–13 exceptions. */
export function ordinal(day: number): string {
  const remainderHundred = day % 100
  if (remainderHundred >= 11 && remainderHundred <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/** "5th of every month" */
export function describeDueDay(dueDay: number): string {
  return `${ordinal(dueDay)} of every month`
}

/** Days in the given month. `month` is 1-based. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** First day of the month containing `iso`, as YYYY-MM-DD. */
export function monthKey(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  return toIso(year, month, 1)
}

/**
 * The date this payment falls due within the month containing `iso`.
 * A due day of 31 lands on the last day of shorter months, so a payment can
 * never silently skip a month.
 */
export function occurrenceInMonth(dueDay: number, iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  return toIso(year, month, Math.min(dueDay, daysInMonth(year, month)))
}

export type PaymentTiming = {
  /** When this payment is due in the current month. */
  occurrence: string
  /** Settled for the current month. */
  paid: boolean
  /** Due date has passed this month and it is still unpaid. */
  overdue: boolean
  /** The commitment has run past its end date; nothing further is owed. */
  ended: boolean
}

/**
 * Status of one payment for the month containing `today`. `paidMonth` is the
 * first of the month a payment was last settled for, so the paid flag clears
 * on its own when the month rolls over.
 */
export function paymentTiming(
  payment: { due_day: number; end_date: string; paid_month: string | null },
  today: string
): PaymentTiming {
  const occurrence = occurrenceInMonth(payment.due_day, today)
  const ended = payment.end_date < today
  const paid = payment.paid_month != null && monthKey(payment.paid_month) === monthKey(today)

  return {
    occurrence,
    paid,
    ended,
    overdue: !paid && !ended && occurrence < today,
  }
}
