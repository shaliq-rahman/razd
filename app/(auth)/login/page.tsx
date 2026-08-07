'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, type AuthState } from '../actions'
import { SubmitButton } from '@/components/submit-button'
import { focusRing } from '@/lib/ui'

const field =
  'ios-field w-full min-h-[52px] rounded-[18px] px-4 py-3.5 text-base text-[#24202a] outline-none transition placeholder:text-[color:var(--text-faint)] focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

export default function LoginPage() {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {})

  return (
    <>
      <p className="eyebrow mb-1">Private & simple</p>
      <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-[color:var(--text-muted)]">Sign in to your Razd account.</p>

      <form action={action} className="space-y-3">
        <input
          className={field}
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <input
          className={field}
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
        />

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        New here?{' '}
        <Link href="/signup" className={`font-semibold text-violet-700 ${focusRing} rounded`}>
          Create an account
        </Link>
      </p>
    </>
  )
}
