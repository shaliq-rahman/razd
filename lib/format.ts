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

/**
 * Keeps an editable rupee value numeric for submission while accepting a
 * comma-formatted value pasted back into the field. At most one decimal point
 * and two paise digits are retained.
 */
export function normalizeAmountInput(value: string): string {
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const decimalAt = cleaned.indexOf('.')

  if (decimalAt === -1) return cleaned.replace(/^0+(?=\d)/, '')

  const whole = cleaned.slice(0, decimalAt).replace(/^0+(?=\d)/, '') || '0'
  const fraction = cleaned.slice(decimalAt + 1).replace(/\./g, '').slice(0, 2)
  return `${whole}.${fraction}`
}

/** Formats a numeric input string with Indian grouping without losing typing state. */
export function formatAmountInput(value: string): string {
  if (!value) return ''

  const normalized = normalizeAmountInput(value)
  const hasDecimal = normalized.includes('.')
  const [whole, fraction = ''] = normalized.split('.')
  const lastThree = whole.slice(-3)
  const leading = whole.slice(0, -3)
  const groupedLeading = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  const grouped = leading ? `${groupedLeading},${lastThree}` : lastThree

  return hasDecimal ? `${grouped}.${fraction}` : grouped
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
