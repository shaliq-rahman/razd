'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { credentialsSchema } from '@/lib/schemas'

export type AuthState = { error?: string; message?: string }

/** Maps Supabase auth errors to plain language, never leaking raw provider text. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'That email is already registered.'
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox for the link.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Try again in a minute.'
  }
  if (m.includes('password')) return 'Password must be at least 8 characters.'
  return 'Something went wrong. Please try again.'
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: friendly(error.message) }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) return { error: friendly(error.message) }

  // With email confirmation enabled, no session comes back yet.
  if (!data.session) {
    return { message: 'Check your inbox to confirm your email, then sign in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
