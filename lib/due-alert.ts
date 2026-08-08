export type DueUrgency = 'normal' | 'soon' | 'urgent' | 'overdue'

function dayNumber(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

/** Urgency of an unpaid due date relative to today. */
export function dueUrgency(dueDate: string, today: string): DueUrgency {
  const days = dayNumber(dueDate) - dayNumber(today)
  if (days < 0) return 'overdue'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'soon'
  return 'normal'
}

export function dueAlertClass(dueDate: string, today: string): string {
  const urgency = dueUrgency(dueDate, today)
  if (urgency === 'overdue') return 'due-alert due-alert-red'
  if (urgency === 'urgent') return 'due-alert due-alert-orange'
  if (urgency === 'soon') return 'due-alert due-alert-yellow'
  return ''
}
