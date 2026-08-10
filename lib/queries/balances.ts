import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import type {
  AccountBalance,
  AccountMonthActivity,
  CardPortfolioItem,
  TransactionWithRefs,
} from '@/lib/types'

/**
 * Reads every non-archived account with its derived balance, richest first.
 * The balance comes from the account_balances view, so it is always consistent
 * with the underlying transactions.
 */
export async function getAccountBalances(): Promise<AccountBalance[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('account_balances')
    .select('id, user_id, name, type, opening_balance, color, is_archived, created_at, balance, card_limit, due_day, minimum_due_paid_month')
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
export function buildCardPortfolio(accounts: AccountBalance[]): CardPortfolioItem[] {
  return accounts
    .filter((account) => account.type === 'card')
    .map((account) => ({
      ...account,
      expenseTotal: 0,
      repaymentTotal: 0,
      utilized: Math.max(0, (account.card_limit ?? account.opening_balance) - account.balance),
      transactionCount: 0,
      recent: [],
    }))
}

export async function getCardPortfolio(): Promise<CardPortfolioItem[]> {
  return buildCardPortfolio(await getAccountBalances())
}

/** Current-month transactions grouped by account for the wallet carousel. */
export async function getAccountMonthActivity(): Promise<AccountMonthActivity> {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(name, color, type), categories(name, icon)')
    .gte('occurred_at', start)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load account activity: ${error.message}`)

  const grouped: AccountMonthActivity = {}
  for (const row of data ?? []) {
    const transaction = { ...row, amount: Number(row.amount) } as TransactionWithRefs
    grouped[transaction.account_id] ??= []
    grouped[transaction.account_id].push(transaction)
  }
  return grouped
}
