'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp, type AuthState } from '../actions'
import { SubmitButton } from '@/components/submit-button'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export default function SignupPage() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {})

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Track every rupee across your accounts.</p>

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
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          required
        />

        {state.message && (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {state.message}
          </p>
        )}
        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </>
  )
}
