import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { getRecentTransactions, getMonthTotals } from '@/lib/queries/transactions'
import { BalanceCard } from '@/components/balance-card'
import { EmptyState } from '@/components/empty-state'
import { BankIcon, ReceiptIcon } from '@/components/icons'
import { focusRing } from '@/lib/ui'
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
        <p className="text-sm text-slate-600">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your money</h1>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<BankIcon className="h-7 w-7" />}
          title="No accounts yet"
          body="Add your first account to see your total balance here."
          action={
            <Link
              href="/accounts"
              className={`inline-flex min-h-[48px] items-center rounded-2xl bg-indigo-600 px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
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
          <p className="text-xs font-medium text-slate-600">In · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">
            {formatINR(month.income)}
          </p>
        </div>
        <div className="glass rounded-3xl px-4 py-4">
          <p className="text-xs font-medium text-slate-600">Out · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-rose-700">
            {formatINR(month.expense)}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent</h2>
          {recent.length > 0 && (
            <Link href="/transactions" className={`-mr-2 inline-flex min-h-[44px] items-center rounded-xl px-2 text-sm font-semibold text-indigo-700 ${focusRing}`}>
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon className="h-7 w-7" />}
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
