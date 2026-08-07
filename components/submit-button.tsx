'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pendingLabel = 'Please wait…',
}: {
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
