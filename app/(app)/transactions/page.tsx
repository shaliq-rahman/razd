import Link from 'next/link'
import { getAllTransactions } from '@/lib/queries/transactions'
import { formatDayLabel } from '@/lib/format'
import { TransactionRow } from '@/components/transaction-row'
import { EmptyState } from '@/components/empty-state'
import { ReceiptIcon, ChevronLeftIcon } from '@/components/icons'
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
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Back"
          className={`-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 ${focusRing}`}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">History</h1>
      </header>

      {days.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="h-7 w-7" />}
          title="No transactions yet"
          body="Tap the + button to log your first one."
        />
      ) : (
        days.map(([day, rows]) => (
          <section key={day}>
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
              {formatDayLabel(day)}
            </h2>
            <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
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
