import { Amount } from './amount'
import { formatDayLabel } from '@/lib/format'
import type { TransactionWithRefs } from '@/lib/types'

/**
 * One transaction line. `showDate` is off in day-grouped lists, where the
 * heading already carries the date.
 */
export function TransactionRow({
  transaction: t,
  showDate = true,
}: {
  transaction: TransactionWithRefs
  showDate?: boolean
}) {
  const meta = [t.accounts?.name, showDate ? formatDayLabel(t.occurred_at) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
        {t.categories?.icon ?? '📦'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-slate-900">
          {t.note || t.categories?.name || 'Transaction'}
        </span>
        <span className="block truncate text-xs text-slate-400">{meta}</span>
      </span>
      <Amount value={t.amount} kind={t.kind} />
    </li>
  )
}
