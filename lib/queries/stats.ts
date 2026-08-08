import { createServerSupabase } from '@/lib/supabase/server'

export type CategorySpend = { name: string; icon: string; total: number; share: number }

type SpendRow = { amount: number; categories: { name: string; icon: string } | null }

/**
 * Groups expense rows by category, largest total first, with each category's
 * share of the whole. Totals accumulate in integer paise to avoid float drift.
 */
export function aggregateByCategory(rows: SpendRow[]): CategorySpend[] {
  const buckets = new Map<string, { icon: string; paise: number }>()

  for (const row of rows) {
    const name = row.categories?.name ?? 'Uncategorised'
    const icon = row.categories?.icon ?? '📦'
    const current = buckets.get(name) ?? { icon, paise: 0 }
    current.paise += Math.round(Number(row.amount) * 100)
    buckets.set(name, current)
  }

  const totalPaise = [...buckets.values()].reduce((a, b) => a + b.paise, 0)
  if (totalPaise === 0) return []

  return [...buckets.entries()]
    .map(([name, { icon, paise }]) => ({
      name,
      icon,
      total: paise / 100,
      share: paise / totalPaise,
    }))
    .sort((a, b) => b.total - a.total)
}

/** First day of the month after the one starting at monthIso, as YYYY-MM-DD. */
function nextMonthStart(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number)
  return month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`
}

/** Expense rows for the calendar month starting at monthIso, aggregated by category. */
export async function getMonthlySpend(monthIso: string): Promise<CategorySpend[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, categories(name, icon)')
    .eq('kind', 'expense')
    .or('note.is.null,note.not.like.Card payment:%')
    .gte('occurred_at', monthIso)
    .lt('occurred_at', nextMonthStart(monthIso))

  if (error) throw new Error(`Failed to load spending: ${error.message}`)
  return aggregateByCategory((data ?? []) as unknown as SpendRow[])
}
