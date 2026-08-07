'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { updateProfile, type ProfileState } from './actions'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, {})

  return (
    <form action={action} className="space-y-3">
      <label htmlFor="display_name" className="block text-xs font-medium text-slate-500">
        Display name
      </label>
      <input
        id="display_name"
        name="display_name"
        className={field}
        defaultValue={displayName}
        required
        maxLength={50}
      />

      {state.saved && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Saved.
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
    </form>
  )
}
