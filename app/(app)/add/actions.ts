'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { transactionPurposeSchema, transactionSchema } from '@/lib/schemas'
import { monthKey } from '@/lib/recurring'

export type ActionState = { error?: string }

export async function createTransaction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse({
    account_id: formData.get('account_id'),
    category_id: formData.get('category_id') ?? '',
    amount: formData.get('amount'),
    kind: formData.get('kind'),
    note: formData.get('note') ?? undefined,
    occurred_at: formData.get('occurred_at'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const purpose = transactionPurposeSchema.safeParse({
    payment_type: formData.get('payment_type') ?? 'regular',
    target_id: formData.get('target_id') ?? '',
  })
  if (!purpose.success) return { error: purpose.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { data: sourceAccount } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('id', parsed.data.account_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!sourceAccount) return { error: 'Account not found. Please refresh and try again.' }

  if (purpose.data.payment_type !== 'regular') {
    if (parsed.data.kind !== 'expense' || sourceAccount.type === 'card') {
      return { error: 'Choose a bank-side account for this payment.' }
    }
    if (!purpose.data.target_id) return { error: 'Choose what you are paying.' }
  }

  if (purpose.data.payment_type === 'recurring') {
    const { data: payment } = await supabase
      .from('recurring_payments')
      .select('id, name, amount, end_date, paid_month')
      .eq('id', purpose.data.target_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!payment) return { error: 'Recurring payment not found.' }
    if (payment.end_date < parsed.data.occurred_at) {
      return { error: 'This recurring payment has already ended.' }
    }
    if (payment.paid_month && monthKey(payment.paid_month) === monthKey(parsed.data.occurred_at)) {
      return { error: 'This recurring payment is already paid for this month.' }
    }
    if (Math.abs(Number(payment.amount) - parsed.data.amount) > 0.001) {
      return { error: 'Use the full recurring payment amount.' }
    }

    const { data: created, error: createError } = await supabase
      .from('transactions')
      .insert({
        ...parsed.data,
        user_id: user.id,
        note: payment.name,
      })
      .select('id')
      .single()
    if (createError || !created) {
      return { error: 'Could not record the recurring payment. Please try again.' }
    }

    const { error: paymentError } = await supabase
      .from('recurring_payments')
      .update({
        account_id: sourceAccount.id,
        paid_month: monthKey(parsed.data.occurred_at),
        paid_transaction_id: created.id,
      })
      .eq('id', payment.id)

    if (paymentError) {
      await supabase.from('transactions').delete().eq('id', created.id)
      return { error: 'Could not mark the recurring payment as paid.' }
    }
  } else if (purpose.data.payment_type === 'card_payment') {
    const { data: targetCard } = await supabase
      .from('account_balances')
      .select('id, name, balance, card_limit')
      .eq('id', purpose.data.target_id)
      .eq('user_id', user.id)
      .eq('type', 'card')
      .maybeSingle()

    if (!targetCard) return { error: 'Credit card not found.' }
    const utilized = Math.max(
      0,
      Number(targetCard.card_limit ?? 0) - Number(targetCard.balance)
    )
    if (utilized <= 0) return { error: 'This card has no used balance to repay.' }
    if (parsed.data.amount > utilized + 0.001) {
      return { error: 'Payment cannot be greater than the card’s used amount.' }
    }

    // One bulk insert is atomic: both sides of the transfer succeed together.
    const { error: transferError } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        account_id: sourceAccount.id,
        category_id: null,
        amount: parsed.data.amount,
        kind: 'expense',
        note: `Card payment: ${targetCard.name}`,
        occurred_at: parsed.data.occurred_at,
      },
      {
        user_id: user.id,
        account_id: targetCard.id,
        category_id: null,
        amount: parsed.data.amount,
        kind: 'income',
        note: `Card payment: ${sourceAccount.name}`,
        occurred_at: parsed.data.occurred_at,
      },
    ])
    if (transferError) return { error: 'Could not transfer the card payment. Please try again.' }
  } else {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...parsed.data, user_id: user.id })

    if (error) return { error: 'Could not save the transaction. Please try again.' }
  }

  // Every screen's numbers derive from transactions, so refresh them all.
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
  revalidatePath('/recurring')
  redirect('/')
}
