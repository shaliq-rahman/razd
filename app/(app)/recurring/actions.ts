'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { recurringPaymentSchema } from '@/lib/schemas'
import { monthKey, occurrenceInMonth } from '@/lib/recurring'

export type RecurringState = { error?: string; ok?: boolean }

/** Today as YYYY-MM-DD in local time. */
function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** Every screen whose numbers depend on a commitment or its transactions. */
function revalidateMoney() {
  revalidatePath('/recurring')
  revalidatePath('/accounts')
  revalidatePath('/')
  revalidatePath('/transactions')
  revalidatePath('/stats')
}

export async function createRecurringPayment(
  _previous: RecurringState,
  formData: FormData
): Promise<RecurringState> {
  const parsed = recurringPaymentSchema.safeParse({
    name: formData.get('name'),
    amount: formData.get('amount'),
    due_day: formData.get('due_day'),
    end_date: formData.get('end_date'),
    account_id: formData.get('account_id') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase
    .from('recurring_payments')
    .insert({ ...parsed.data, user_id: user.id })

  if (error) return { error: 'Could not add the payment. Please try again.' }
  revalidateMoney()
  return { ok: true }
}

export async function deleteRecurringPayment(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createServerSupabase()
  await supabase.from('recurring_payments').delete().eq('id', id)
  revalidateMoney()
}

/**
 * Settles or un-settles a commitment for the current month.
 *
 * Marking it paid records a real transaction against the linked account, so the
 * money actually moves rather than a flag merely flipping:
 *   - on a card, a repayment is income, which raises the available balance and
 *     therefore lowers the card's outstanding;
 *   - on any other account, the money leaves, so it is an expense.
 * Un-marking deletes that transaction again, leaving no trace behind.
 */
export async function setRecurringPaid(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const wantPaid = formData.get('is_paid') === 'true'
  if (!id) return

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: payment } = await supabase
    .from('recurring_payments')
    .select('*, accounts(type)')
    .eq('id', id)
    .maybeSingle()

  // RLS scopes the read, so a row belonging to someone else simply is not found.
  if (!payment) return

  const today = todayIso()

  if (!wantPaid) {
    // Remove the transaction this payment created, if it still exists.
    if (payment.paid_transaction_id) {
      await supabase.from('transactions').delete().eq('id', payment.paid_transaction_id)
    }
    await supabase
      .from('recurring_payments')
      .update({ paid_month: null, paid_transaction_id: null })
      .eq('id', id)
    revalidateMoney()
    return
  }

  let transactionId: string | null = null

  if (payment.account_id) {
    const isCard = payment.accounts?.type === 'card'
    const { data: created, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: payment.account_id,
        amount: Number(payment.amount),
        kind: isCard ? 'income' : 'expense',
        note: payment.name,
        occurred_at: occurrenceInMonth(Number(payment.due_day), today),
      })
      .select('id')
      .single()

    // Without the transaction the outstanding would not move, so do not claim
    // the payment was settled.
    if (error || !created) return
    transactionId = created.id
  }

  await supabase
    .from('recurring_payments')
    .update({ paid_month: monthKey(today), paid_transaction_id: transactionId })
    .eq('id', id)

  revalidateMoney()
}
