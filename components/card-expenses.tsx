import Link from 'next/link'
import { CardIcon } from '@/components/icons'
import { formatINR } from '@/lib/format'
import { focusRing } from '@/lib/ui'
import type { CardExpenseSummary } from '@/lib/types'

export function CardExpenses({
  summary,
  month,
}: {
  summary: CardExpenseSummary
  month: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="eyebrow">Cards</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#201d27]">
            Card expenses
          </h2>
        </div>
        {summary.count > 0 && (
          <Link
            href="/transactions"
            className={`-mr-2 inline-flex min-h-[44px] items-center rounded-xl px-2 text-sm font-semibold text-violet-700 ${focusRing}`}
          >
            View history
          </Link>
        )}
      </div>

      <div className="animate-rise overflow-hidden rounded-[28px] border-2 border-[#191919] bg-[radial-gradient(90%_120%_at_100%_0%,rgba(196,181,253,0.48),transparent_60%),linear-gradient(145deg,#ffffff,#ecfeff)] shadow-[4px_4px_0_#191919] [animation-delay:130ms]">
        <div className="relative flex items-center gap-4 px-5 py-5">
          <div
            aria-hidden="true"
            className="absolute -top-12 -right-8 h-36 w-36 rounded-full bg-violet-300/30 blur-3xl"
          />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-[#27222f] text-white shadow-lg shadow-violet-950/15">
            <CardIcon className="h-5 w-5" />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="text-xs font-medium text-[color:var(--text-muted)]">Spent in {month}</p>
            <p className="mt-0.5 text-2xl font-bold tracking-[-0.025em] tabular-nums text-[#24202a]">
              {formatINR(summary.total)}
            </p>
          </div>
          <span className="relative rounded-full bg-white/65 px-3 py-1.5 text-xs font-semibold text-[#655c70] shadow-sm">
            {summary.count} {summary.count === 1 ? 'payment' : 'payments'}
          </span>
        </div>

        {summary.recent.length > 0 ? (
          <ul className="divide-y divide-violet-200/35 border-t border-violet-200/40 bg-white/28 px-5">
            {summary.recent.map((transaction) => (
              <li key={transaction.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-white/70 text-sm"
                  aria-hidden="true"
                >
                  {transaction.categories?.icon ?? '•'}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#403946]">
                  {transaction.note || transaction.categories?.name || 'Card payment'}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#403946]">
                  {formatINR(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-violet-200/40 bg-white/25 px-5 py-3 text-sm text-[#746d7c]">
            No card payments recorded this month.
          </p>
        )}
      </div>
    </section>
  )
}
