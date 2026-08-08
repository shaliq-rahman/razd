/** Visual urgency for a card's currently utilized/outstanding amount. */
export function cardAlertClass(amount: number): string {
  if (amount >= 30_000) return 'card-alert card-alert-red'
  if (amount >= 20_000) return 'card-alert card-alert-orange'
  if (amount >= 10_000) return 'card-alert card-alert-yellow'
  return ''
}

/**
 * A paid minimum covers the current billing cycle until the following due date.
 * On that due date, alerts may resume for the new cycle.
 */
export function isMinimumDueCovered(
  paidMonth: string | null | undefined,
  dueDay: number | null | undefined,
  today: string
): boolean {
  if (!paidMonth) return false
  if (paidMonth.slice(0, 7) === today.slice(0, 7)) return true
  if (!dueDay) return false

  const [year, month] = paidMonth.split('-').map(Number)
  const nextMonth = new Date(Date.UTC(year, month, 1))
  const nextYear = nextMonth.getUTCFullYear()
  const nextMonthNumber = nextMonth.getUTCMonth() + 1
  const lastDay = new Date(Date.UTC(nextYear, nextMonthNumber, 0)).getUTCDate()
  const nextDueDate = `${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-${String(
    Math.min(dueDay, lastDay)
  ).padStart(2, '0')}`

  return today < nextDueDate
}
