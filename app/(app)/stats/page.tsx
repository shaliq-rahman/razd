import { getMonthlySpend } from '@/lib/queries/stats'
import { monthStart } from '@/lib/queries/transactions'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { EmptyState } from '@/components/empty-state'
import { ChartIcon } from '@/components/icons'

// Non-text contrast >=3:1 against the light surface, and distinguishable
// without relying on hue alone (each row also shows its value and percentage).
const BARS = ['#4F46E5', '#7C3AED', '#0369A1', '#0D9488', '#B45309', '#BE123C']

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
        <p className="text-sm text-slate-600">{monthName}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Spending</h1>
      </header>

      {spend.length === 0 ? (
        <EmptyState
          icon={<ChartIcon className="h-7 w-7" />}
          title="No spending this month"
          body="Log an expense and your breakdown appears here."
        />
      ) : (
        <>
          <section className="glass glass-lit animate-rise relative overflow-hidden rounded-[30px] px-6 py-6">
            <p className="text-sm font-medium text-slate-600">Total spent</p>
            <p
              data-testid="total-spent"
              className="mt-1 text-[clamp(1.7rem,8vw,2.3rem)] font-bold tabular-nums text-slate-900"
            >
              {formatINR(total)}
            </p>

            <div className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-200/80">
              {spend.map((s, i) => (
                <div
                  key={s.name}
                  style={{ width: `${s.share * 100}%`, background: BARS[i % BARS.length] }}
                  title={`${s.name} ${Math.round(s.share * 100)}%`}
                />
              ))}
            </div>
          </section>

          <ul className="glass glass-lit animate-rise divide-y divide-slate-200/70 rounded-3xl px-4 [animation-delay:80ms]">
            {spend.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 py-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg"
                  aria-hidden="true"
                >
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
                  <span className="block text-xs text-slate-600">
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
