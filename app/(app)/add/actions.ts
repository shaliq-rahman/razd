'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/schemas'

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

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase
    .from('transactions')
    .insert({ ...parsed.data, user_id: user.id })

  if (error) return { error: 'Could not save the transaction. Please try again.' }

  // Every screen's numbers derive from transactions, so refresh them all.
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
  redirect('/')
}
