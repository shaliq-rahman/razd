import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { getRecentTransactions, getMonthTotals } from '@/lib/queries/transactions'
import { BalanceCard } from '@/components/balance-card'
import { EmptyState } from '@/components/empty-state'
import { TransactionRow } from '@/components/transaction-row'
import { formatINR } from '@/lib/format'

export default async function HomePage() {
  const [accounts, recent, month] = await Promise.all([
    getAccountBalances(),
    getRecentTransactions(5),
    getMonthTotals(),
  ])

  const now = new Date()
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(now)
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(now)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your money</h1>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No accounts yet"
          body="Add your first account to see your total balance here."
          action={
            <Link
              href="/accounts"
              className="inline-block rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white"
            >
              Add an account
            </Link>
          }
        />
      ) : (
        <BalanceCard accounts={accounts} />
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl px-4 py-4">
          <p className="text-xs font-medium text-slate-500">In · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">
            {formatINR(month.income)}
          </p>
        </div>
        <div className="glass rounded-3xl px-4 py-4">
          <p className="text-xs font-medium text-slate-500">Out · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-rose-500">
            {formatINR(month.expense)}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent</h2>
          {recent.length > 0 && (
            <Link href="/transactions" className="text-sm font-medium text-indigo-600">
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Nothing logged yet"
            body="Tap the + button to add your first transaction."
          />
        ) : (
          <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
