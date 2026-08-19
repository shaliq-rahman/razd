'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { transactionEditSchema } from '@/lib/schemas'

export type EditTransactionState = { error?: string; ok?: boolean }

function revalidateMoney() {
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
  revalidatePath('/recurring')
}

export async function updateTransaction(
  _previous: EditTransactionState,
  formData: FormData
): Promise<EditTransactionState> {
  const parsed = transactionEditSchema.safeParse({
    id: formData.get('id'),
    account_id: formData.get('account_id'),
    category_id: formData.get('category_id') ?? '',
    amount: formData.get('amount'),
    kind: formData.get('kind'),
    occurred_at: formData.get('occurred_at'),
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { data: existing } = await supabase
    .from('transactions')
    .select('id, note')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return { error: 'Transaction not found. Please refresh and try again.' }

  // A card repayment has a matching bank/card row. Editing just one half would
  // corrupt the transfer, so those rows are managed by the payment flow.
  if (existing.note?.startsWith('Card payment:')) {
    return { error: 'Card-payment transfers cannot be edited from history.' }
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', parsed.data.account_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!account) return { error: 'Choose a valid account.' }

  const { error } = await supabase
    .from('transactions')
    .update({
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id ?? null,
      amount: parsed.data.amount,
      kind: parsed.data.kind,
      occurred_at: parsed.data.occurred_at,
      note: parsed.data.note || null,
    })
    .eq('id', existing.id)
    .eq('user_id', user.id)

  if (error) return { error: 'Could not update the transaction. Please try again.' }

  revalidateMoney()
  return { ok: true }
}
