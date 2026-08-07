import { getMonthlySpend } from '@/lib/queries/stats'
import { monthStart } from '@/lib/queries/transactions'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { EmptyState } from '@/components/empty-state'

const BARS = ['#6366F1', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444']

export default async function StatsPage() {
  const now = new Date()
  const spend = await getMonthlySpend(monthStart(now))
  const total = sumAmounts(spend.map((s) => s.total))
  const monthName = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-slate-500">{monthName}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Spending</h1>
      </header>

      {spend.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No spending this month"
          body="Log an expense and your breakdown appears here."
        />
      ) : (
        <>
          <section className="glass rounded-[28px] px-6 py-6">
            <p className="text-sm font-medium text-slate-500">Total spent</p>
            <p
              data-testid="total-spent"
              className="mt-1 text-[clamp(1.7rem,8vw,2.3rem)] font-bold tabular-nums text-slate-900"
            >
              {formatINR(total)}
            </p>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {spend.map((s, i) => (
                <div
                  key={s.name}
                  style={{ width: `${s.share * 100}%`, background: BARS[i % BARS.length] }}
                  title={`${s.name} ${Math.round(s.share * 100)}%`}
                />
              ))}
            </div>
          </section>

          <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
            {spend.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  {s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{s.name}</span>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${s.share * 100}%`,
                        background: BARS[i % BARS.length],
                      }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums text-slate-900">
                    {formatINR(s.total)}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {Math.round(s.share * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
