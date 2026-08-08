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
  onEdit,
}: {
  transaction: TransactionWithRefs
  showDate?: boolean
  onEdit?: () => void
}) {
  const meta = [t.accounts?.name, showDate ? formatDayLabel(t.occurred_at) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="flex items-center gap-3 py-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#f1eff3] text-lg shadow-[inset_0_0_0_1px_rgba(80,72,92,0.04)]"
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
      <span className="flex shrink-0 items-center gap-1.5">
        <Amount value={t.amount} kind={t.kind} />
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${t.note || t.categories?.name || 'transaction'}`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[color:var(--text-muted)] transition hover:bg-white/70 hover:text-violet-700 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
              <path d="m13.5 8 3 3" />
            </svg>
          </button>
        )}
      </span>
    </li>
  )
}
