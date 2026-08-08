import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import {
  getCardExpenseSummary,
  getMonthExpenseTransactions,
  getRecentTransactions,
  getMonthTotals,
} from '@/lib/queries/transactions'
import { BalanceCard } from '@/components/balance-card'
import { EmptyState } from '@/components/empty-state'
import { WalletScene, ReceiptScene } from '@/components/illustrations'
import { focusRing } from '@/lib/ui'
import { TransactionRow } from '@/components/transaction-row'
import { formatINR } from '@/lib/format'
import { CardExpenses } from '@/components/card-expenses'
import { ItemSpends } from '@/components/item-spends'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
    : { data: null }

  const [accounts, recent, month, cardExpenses, itemSpends] = await Promise.all([
    getAccountBalances(),
    getRecentTransactions(5),
    getMonthTotals(),
    getCardExpenseSummary(),
    getMonthExpenseTransactions(),
  ])

  const now = new Date()
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(now)
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(now)
  const displayName = profile?.display_name?.trim() || user?.email?.split('@')[0] || 'there'
  const profileInitial = displayName.charAt(0).toLocaleUpperCase('en-IN')
  const bankAccounts = accounts.filter((account) => account.type !== 'card')

  return (
    <div className="space-y-5">
      <header className="relative flex items-end justify-between pt-1">
        {/* Beautiful vector gradients behind the header */}
        <div className="vector-blur bg-violet-400 w-48 h-48 rounded-full top-[-2rem] left-[-2rem]"></div>
        <div className="vector-blur bg-cyan-400 w-40 h-40 rounded-full top-[-1rem] right-[20%]"></div>
        
        <div className="relative z-10">
          <p className="eyebrow mb-1">{today}</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.04em] text-compact text-[#1d1a24]">
            Hi, {displayName}
          </h1>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <ItemSpends transactions={itemSpends} compact />
          <Link
            href="/transactions"
            aria-label="Transaction history"
            className={`surface-card press flex h-11 w-11 cursor-pointer items-center justify-center rounded-[13px] text-violet-700 ${focusRing}`}
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />
            </svg>
          </Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#1d1a24] text-sm font-bold text-white shadow-lg shadow-slate-900/15" aria-label={`${displayName} profile`}>
            {profileInitial}
          </div>
        </div>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          art={<WalletScene className="h-32 w-32" />}
          title="No accounts yet"
          body="Add your first account to see your total balance here."
          action={
            <Link
              href="/accounts"
              className={`inline-flex min-h-[48px] items-center rounded-[14px] bg-indigo-600 px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
            >
              Add an account
            </Link>
          }
        />
      ) : (
        <BalanceCard accounts={bankAccounts} />
      )}

      <section className="grid grid-cols-2 gap-3 relative">
        <div className="surface-card compact-card animate-rise rounded-[24px] [animation-delay:60ms]">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[color:var(--text-muted)] uppercase">
            <span className="flex h-6 w-6 items-center justify-center rounded-[9px] bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
            In · {monthName}
          </p>
          <p className="mt-1 text-[16px] font-bold tracking-tight text-compact tabular-nums text-[#25212b]">
            {formatINR(month.income)}
          </p>
        </div>
        <div className="surface-card compact-card animate-rise rounded-[24px] [animation-delay:110ms]">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[color:var(--text-muted)] uppercase">
            <span className="flex h-6 w-6 items-center justify-center rounded-[9px] bg-rose-100 text-rose-700">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
            Out · {monthName}
          </p>
          <p className="mt-1 text-[16px] font-bold tracking-tight text-compact tabular-nums text-[#25212b]">
            {formatINR(month.expense)}
          </p>
        </div>
      </section>

      <CardExpenses summary={cardExpenses} month={monthName} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#201d27]">Recent transactions</h2>
          </div>
          {recent.length > 0 && (
            <Link href="/transactions" className={`-mr-2 inline-flex min-h-[44px] items-center rounded-xl px-2 text-sm font-semibold text-violet-700 ${focusRing}`}>
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            art={<ReceiptScene className="h-32 w-32" />}
            title="Nothing logged yet"
            body="Tap the + button to add your first transaction."
          />
        ) : (
          <ul className="surface-card animate-rise divide-y divide-[#dedbe3]/70 rounded-[13px] px-4 [animation-delay:160ms]">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
