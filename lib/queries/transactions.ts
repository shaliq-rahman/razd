import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import { sumAmounts } from '@/lib/money'
import type { CardExpenseSummary, TransactionWithRefs } from '@/lib/types'

const WITH_REFS = 'id, user_id, account_id, category_id, amount, kind, note, occurred_at, created_at, accounts(name, color, type), categories(name, icon)'

function normalise(rows: unknown[]): TransactionWithRefs[] {
  return (rows as TransactionWithRefs[]).map((t) => ({ ...t, amount: Number(t.amount) }))
}

/** Most recent transactions, newest first, with account and category display fields. */
export async function getRecentTransactions(limit = 5): Promise<TransactionWithRefs[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select(WITH_REFS)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to load transactions: ${error.message}`)
  return normalise(data ?? [])
}

/** Every transaction, newest first, capped so one query cannot grow unbounded. */
export async function getAllTransactions(limit = 500): Promise<TransactionWithRefs[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select(WITH_REFS)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to load transactions: ${error.message}`)
  return normalise(data ?? [])
}

/** First day of the month containing `date`, as YYYY-MM-DD. */
export function monthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export type HomeTransactionData = {
  recent: TransactionWithRefs[]
  month: { income: number; expense: number }
  cardExpenses: CardExpenseSummary
  itemSpends: TransactionWithRefs[]
}

/**
 * Loads the home dashboard with two requests instead of four overlapping
 * current-month scans plus a recent-transactions request. The month rows are
 * shared in memory to derive totals, item spends, and card spending.
 */
export async function getHomeTransactionData(): Promise<HomeTransactionData> {
  const supabase = await createServerSupabase()
  const start = monthStart(new Date())
  const [recentResult, monthResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(WITH_REFS)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('transactions')
      .select(WITH_REFS)
      .gte('occurred_at', start)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(250),
  ])

  if (recentResult.error) {
    throw new Error(`Failed to load recent transactions: ${recentResult.error.message}`)
  }
  if (monthResult.error) {
    throw new Error(`Failed to load monthly transactions: ${monthResult.error.message}`)
  }

  const monthRows = normalise(monthResult.data ?? [])
  const visibleRows = monthRows.filter((row) => !row.note?.startsWith('Card payment:'))
  const itemSpends = visibleRows.filter((row) => row.kind === 'expense')
  const cardRows = itemSpends.filter((row) => row.accounts?.type === 'card')

  return {
    recent: normalise(recentResult.data ?? []),
    month: {
      income: sumAmounts(
        visibleRows.filter((row) => row.kind === 'income').map((row) => row.amount)
      ),
      expense: sumAmounts(itemSpends.map((row) => row.amount)),
    },
    cardExpenses: {
      total: sumAmounts(cardRows.map((row) => row.amount)),
      count: cardRows.length,
      recent: cardRows.slice(0, 3),
    },
    itemSpends,
  }
}

/** Income and expense totals for the current calendar month. */
export async function getMonthTotals(): Promise<{ income: number; expense: number }> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, kind')
    .or('note.is.null,note.not.like.Card payment:%')
    .gte('occurred_at', monthStart(new Date()))

  if (error) throw new Error(`Failed to load month totals: ${error.message}`)

  const rows = data ?? []
  return {
    income: sumAmounts(rows.filter((r) => r.kind === 'income').map((r) => Number(r.amount))),
    expense: sumAmounts(rows.filter((r) => r.kind === 'expense').map((r) => Number(r.amount))),
  }
}

/** Itemized current-month expenses with their source account or card. */
export async function getMonthExpenseTransactions(): Promise<TransactionWithRefs[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select(WITH_REFS)
    .eq('kind', 'expense')
    .or('note.is.null,note.not.like.Card payment:%')
    .gte('occurred_at', monthStart(new Date()))
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(250)

  if (error) throw new Error(`Failed to load item spends: ${error.message}`)
  return normalise(data ?? [])
}

/** Current-month expenses paid specifically from card-type accounts. */
export async function getCardExpenseSummary(): Promise<CardExpenseSummary> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts!inner(name, color, type), categories(name, icon)')
    .eq('kind', 'expense')
    .eq('accounts.type', 'card')
    .gte('occurred_at', monthStart(new Date()))
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load card expenses: ${error.message}`)

  const rows = normalise(data ?? [])
  return {
    total: sumAmounts(rows.map((row) => row.amount)),
    count: rows.length,
    recent: rows.slice(0, 3),
  }
}
