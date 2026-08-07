import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import type { RecurringPaymentWithAccount } from '@/lib/types'

/**
 * Every monthly commitment, unpaid first, then in due-day order so the next
 * thing owed sits at the top.
 */
export async function getRecurringPayments(): Promise<RecurringPaymentWithAccount[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('recurring_payments')
    .select('*, accounts(name, color, type)')
    .order('due_day', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load recurring payments: ${error.message}`)

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    due_day: Number(row.due_day),
  })) as RecurringPaymentWithAccount[]
}
