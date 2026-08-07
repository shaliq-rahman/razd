const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats a rupee amount with Indian digit grouping, e.g. ₹1,23,456.00 */
export function formatINR(amount: number): string {
  // Format the magnitude and place the sign ourselves, so a negative total reads
  // "-₹2,500.00" rather than the locale's "₹-2,500.00".
  const formatted = inr.format(Math.abs(amount))
  return amount < 0 ? `-${formatted}` : formatted
}

/** Formats a positive amount with an explicit +/- based on transaction kind. */
export function formatSignedINR(amount: number, kind: 'income' | 'expense'): string {
  const sign = kind === 'income' ? '+' : '-'
  return `${sign}${inr.format(Math.abs(amount))}`
}

const dayMonth = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function toLocalMidnight(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Returns "Today", "Yesterday", or "30 Jul 2026" for a YYYY-MM-DD date string. */
export function formatDayLabel(iso: string, today: Date = new Date()): string {
  const date = toLocalMidnight(iso)
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayMs = 86_400_000
  const diff = Math.round((ref.getTime() - date.getTime()) / dayMs)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return dayMonth.format(date)
}
