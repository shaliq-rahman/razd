import { Amount } from './amount'
import { CategoryIcon } from './icons'
import { formatDayLabel } from '@/lib/format'
import type { TransactionWithRefs } from '@/lib/types'

const CATEGORY_TONES: Record<string, string> = {
  food: 'bg-amber-100 text-amber-700 ring-amber-200/70',
  transport: 'bg-sky-100 text-sky-700 ring-sky-200/70',
  shopping: 'bg-violet-100 text-violet-700 ring-violet-200/70',
  bills: 'bg-cyan-100 text-cyan-700 ring-cyan-200/70',
  health: 'bg-rose-100 text-rose-700 ring-rose-200/70',
  entertainment: 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200/70',
  salary: 'bg-emerald-100 text-emerald-700 ring-emerald-200/70',
  diapers: 'bg-indigo-100 text-indigo-700 ring-indigo-200/70',
  diaper: 'bg-indigo-100 text-indigo-700 ring-indigo-200/70',
  fruits: 'bg-lime-100 text-lime-700 ring-lime-200/70',
  fruit: 'bg-lime-100 text-lime-700 ring-lime-200/70',
  'fruits & vegetables': 'bg-lime-100 text-lime-700 ring-lime-200/70',
  'fruits and vegetables': 'bg-lime-100 text-lime-700 ring-lime-200/70',
  vegetables: 'bg-green-100 text-green-700 ring-green-200/70',
  vegetable: 'bg-green-100 text-green-700 ring-green-200/70',
}

function transactionIconTone(t: TransactionWithRefs) {
  const category = t.categories?.name?.trim().toLowerCase() ?? ''
  if (CATEGORY_TONES[category]) return CATEGORY_TONES[category]
  if (t.kind === 'income') return 'bg-emerald-100 text-emerald-700 ring-emerald-200/70'
  return 'bg-slate-100 text-slate-600 ring-slate-200/80'
}

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
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ring-1 ${transactionIconTone(t)}`}
        aria-hidden="true"
      >
        <CategoryIcon name={t.categories?.name} className="h-5 w-5" />
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
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[color:var(--text-muted)] transition hover:bg-white/70 hover:text-violet-700 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
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
