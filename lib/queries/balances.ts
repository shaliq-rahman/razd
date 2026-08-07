import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import type { AccountBalance } from '@/lib/types'

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
  })) as AccountBalance[]
}
