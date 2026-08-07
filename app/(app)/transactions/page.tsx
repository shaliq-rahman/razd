import Link from 'next/link'
import { getAllTransactions } from '@/lib/queries/transactions'
import { formatDayLabel } from '@/lib/format'
import { TransactionRow } from '@/components/transaction-row'
import { EmptyState } from '@/components/empty-state'
import { ChevronLeftIcon } from '@/components/icons'
import { ReceiptScene } from '@/components/illustrations'
import { focusRing } from '@/lib/ui'
import type { TransactionWithRefs } from '@/lib/types'

/** Groups an already-sorted list into [date, rows] pairs, preserving order. */
function groupByDay(rows: TransactionWithRefs[]): [string, TransactionWithRefs[]][] {
  const groups = new Map<string, TransactionWithRefs[]>()
  for (const t of rows) {
    const list = groups.get(t.occurred_at) ?? []
    list.push(t)
    groups.set(t.occurred_at, list)
  }
  return [...groups.entries()]
}

export default async function TransactionsPage() {
  const transactions = await getAllTransactions()
  const days = groupByDay(transactions)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Back"
          className={`-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 ${focusRing}`}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <p className="eyebrow">Money moves</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">History</h1>
        </div>
      </header>

      {days.length === 0 ? (
        <EmptyState
          art={<ReceiptScene className="h-32 w-32" />}
          title="No transactions yet"
          body="Tap the + button to log your first one."
        />
      ) : (
        days.map(([day, rows]) => (
          <section key={day}>
            <h2 className="eyebrow mb-2 px-1">
              {formatDayLabel(day)}
            </h2>
            <ul className="surface-card animate-rise divide-y divide-[#dedbe3]/70 rounded-[28px] px-4">
              {rows.map((t) => (
                <TransactionRow key={t.id} transaction={t} showDate={false} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
