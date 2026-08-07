import { getMonthlySpend } from '@/lib/queries/stats'
import { monthStart } from '@/lib/queries/transactions'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { EmptyState } from '@/components/empty-state'
import { ChartScene } from '@/components/illustrations'

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
      <header className="pt-1">
        <p className="eyebrow mb-1">{monthName}</p>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Spending</h1>
      </header>

      {spend.length === 0 ? (
        <EmptyState
          art={<ChartScene className="h-32 w-32" />}
          title="No spending this month"
          body="Log an expense and your breakdown appears here."
        />
      ) : (
        <>
          <section className="hero-card animate-rise relative overflow-hidden rounded-[32px] px-6 py-7 text-white">
            <div aria-hidden="true" className="absolute -right-16 -bottom-20 h-52 w-52 rounded-full bg-violet-400/30 blur-3xl" />
            <p className="relative text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">Total spent</p>
            <p
              data-testid="total-spent"
              className="relative mt-2 text-[clamp(2rem,9vw,2.65rem)] font-bold tracking-[-0.03em] tabular-nums text-white"
            >
              {formatINR(total)}
            </p>

            <div className="relative mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/12">
              {spend.map((s, i) => (
                <div
                  key={s.name}
                  style={{ width: `${s.share * 100}%`, background: BARS[i % BARS.length] }}
                  title={`${s.name} ${Math.round(s.share * 100)}%`}
                />
              ))}
            </div>
          </section>

          <ul className="surface-card animate-rise divide-y divide-[#dedbe3]/70 rounded-[28px] px-4 [animation-delay:80ms]">
            {spend.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 py-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#f1eff3] text-lg"
                  aria-hidden="true"
                >
                  {s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[#25212b]">{s.name}</span>
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
