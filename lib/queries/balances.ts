import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import { sumAmounts } from '@/lib/money'
import type { AccountBalance, CardPortfolioItem, TransactionWithRefs } from '@/lib/types'

/**
 * Reads every non-archived account with its derived balance, richest first.
 * The balance comes from the account_balances view, so it is always consistent
 * with the underlying transactions.
 */
export async function getAccountBalances(): Promise<AccountBalance[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('account_balances')
    .select('*')
    .eq('is_archived', false)
    .order('balance', { ascending: false })

  if (error) throw new Error(`Failed to load accounts: ${error.message}`)

  // Postgres numeric arrives as a string over PostgREST; coerce before arithmetic.
  return (data ?? []).map((r) => ({
    ...r,
    balance: Number(r.balance),
    opening_balance: Number(r.opening_balance),
    card_limit: r.card_limit == null ? null : Number(r.card_limit),
    due_day: r.due_day == null ? null : Number(r.due_day),
  })) as AccountBalance[]
}

/** Card accounts with transaction-derived utilization and recent activity. */
export async function getCardPortfolio(): Promise<CardPortfolioItem[]> {
  const supabase = await createServerSupabase()
  const { data: accountRows, error: accountError } = await supabase
    .from('account_balances')
    .select('*')
    .eq('is_archived', false)
    .eq('type', 'card')
    .order('created_at', { ascending: true })

  if (accountError) throw new Error(`Failed to load cards: ${accountError.message}`)

  const accounts = (accountRows ?? []).map((row) => ({
    ...row,
    balance: Number(row.balance),
    opening_balance: Number(row.opening_balance),
    card_limit: row.card_limit == null ? null : Number(row.card_limit),
    due_day: row.due_day == null ? null : Number(row.due_day),
  })) as AccountBalance[]

  if (accounts.length === 0) return []

  const { data: transactionRows, error: transactionError } = await supabase
    .from('transactions')
    .select('*, accounts(name, color, type), categories(name, icon)')
    .in('account_id', accounts.map((account) => account.id))
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (transactionError) {
    throw new Error(`Failed to load card activity: ${transactionError.message}`)
  }

  const transactions = (transactionRows ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  })) as TransactionWithRefs[]

  return accounts.map((account) => {
    const activity = transactions.filter((row) => row.account_id === account.id)
    const expenseTotal = sumAmounts(
      activity.filter((row) => row.kind === 'expense').map((row) => row.amount)
    )
    const repaymentTotal = sumAmounts(
      activity.filter((row) => row.kind === 'income').map((row) => row.amount)
    )

    return {
      ...account,
      expenseTotal,
      repaymentTotal,
      // Available balance is derived by the view. Comparing it with the stored
      // total limit also captures pre-existing utilization entered at setup.
      utilized: Math.max(0, (account.card_limit ?? account.opening_balance) - account.balance),
      transactionCount: activity.length,
      recent: activity.slice(0, 3),
    }
  })
}
