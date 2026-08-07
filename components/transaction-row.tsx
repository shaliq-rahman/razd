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
    <li className="flex items-center gap-3 py-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#f1eff3] text-lg shadow-[inset_0_0_0_1px_rgba(80,72,92,0.04)]"
        aria-hidden="true"
      >
        {t.categories?.icon ?? '•'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[#25212b]">
          {t.note || t.categories?.name || 'Transaction'}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[color:var(--text-muted)]">{meta}</span>
      </span>
      <Amount value={t.amount} kind={t.kind} />
    </li>
  )
}
