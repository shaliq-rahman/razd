'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/schemas'

export type ProfileState = { error?: string; saved?: boolean }

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
