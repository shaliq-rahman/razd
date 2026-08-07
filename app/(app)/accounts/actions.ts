'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { accountSchema } from '@/lib/schemas'

export type ActionState = { error?: string; ok?: boolean }

function fields(formData: FormData) {
  return {
    name: formData.get('name'),
    type: formData.get('type'),
    opening_balance: formData.get('opening_balance'),
    color: formData.get('color'),
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

export async function deleteAccount(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createServerSupabase()
  await supabase.from('accounts').delete().eq('id', id)

  revalidateMoney()
}
