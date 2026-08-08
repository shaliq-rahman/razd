'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/schemas'

export type ProfileState = { error?: string; saved?: boolean }
export type ResetDataState = { error?: string; reset?: boolean }

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({ display_name: formData.get('display_name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { error: 'Could not save your profile. Please try again.' }

  revalidatePath('/profile')
  return { saved: true }
}

export async function resetFinanceData(
  _previous: ResetDataState,
  formData: FormData
): Promise<ResetDataState> {
  if (formData.get('confirmation') !== 'RESET') {
    return { error: 'Please confirm the reset before continuing.' }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  // Keep profile preferences and built-in categories. Every delete is scoped by
  // both this filter and RLS, so another user's records cannot be touched.
  const { error: recurringError } = await supabase
    .from('recurring_payments')
    .delete()
    .eq('user_id', user.id)
  if (recurringError) return { error: 'Could not reset your data. Please try again.' }

  const { error: transactionError } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id)
  if (transactionError) return { error: 'Could not reset your data. Please try again.' }

  const { error: accountError } = await supabase
    .from('accounts')
    .delete()
    .eq('user_id', user.id)
  if (accountError) return { error: 'Could not reset your data. Please try again.' }

  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/recurring')
  revalidatePath('/stats')
  revalidatePath('/profile')
  return { reset: true }
}
