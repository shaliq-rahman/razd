'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { accountSchema, cardPaymentSchema } from '@/lib/schemas'

export type ActionState = { error?: string; ok?: boolean }

function fields(formData: FormData) {
  return {
    name: formData.get('name'),
    type: formData.get('type'),
    opening_balance: formData.get('opening_balance'),
    color: formData.get('color'),
    card_limit: formData.get('card_limit'),
    due_day: formData.get('due_day'),
  }
}

/** Refreshes every screen whose numbers depend on accounts. */
function revalidateMoney() {
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
}

export async function createAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = accountSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase.from('accounts').insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: 'Could not save the account. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function updateAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing account.' }

  const parsed = accountSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  // RLS scopes this to the signed-in user, so another user's id matches nothing.
  const { error } = await supabase.from('accounts').update(parsed.data).eq('id', id)
  if (error) return { error: 'Could not update the account. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function deleteAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing account.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) return { error: 'Could not delete the account. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function addCardPayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = cardPaymentSchema.safeParse({
    account_id: formData.get('account_id'),
    amount: formData.get('amount'),
    occurred_at: formData.get('occurred_at'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { data: card, error: cardError } = await supabase
    .from('account_balances')
    .select('id, name, balance, card_limit')
    .eq('id', parsed.data.account_id)
    .eq('user_id', user.id)
    .eq('type', 'card')
    .maybeSingle()

  if (cardError || !card) return { error: 'Card not found. Please refresh and try again.' }

  const utilized = Math.max(0, Number(card.card_limit ?? 0) - Number(card.balance))
  if (utilized <= 0) return { error: 'This card has no used balance to repay.' }
  if (parsed.data.amount > utilized + 0.001) {
    return { error: 'Payment cannot be greater than the used amount.' }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: card.id,
    category_id: null,
    amount: parsed.data.amount,
    kind: 'income',
    note: `Card payment: ${card.name}`,
    occurred_at: parsed.data.occurred_at,
  })
  if (error) return { error: 'Could not add the card payment. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function setCardMinimumDuePaid(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const month = String(formData.get('month') ?? '')
  const paid = formData.get('paid') === 'true'
  if (!id || !/^\d{4}-\d{2}-01$/.test(month)) return

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('accounts')
    .update({ minimum_due_paid_month: paid ? month : null })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('type', 'card')

  revalidateMoney()
  revalidatePath('/recurring')
}
