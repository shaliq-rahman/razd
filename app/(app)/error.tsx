'use client'

import { AlertIcon } from '@/components/icons'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass mt-10 rounded-3xl px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <AlertIcon className="h-7 w-7" />
      </div>
      <h2 className="font-semibold text-slate-900">Something went wrong</h2>
      <p className="mx-auto mt-1 max-w-[30ch] text-sm text-slate-600">
        We could not load this screen. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="mt-5 min-h-[48px] cursor-pointer rounded-2xl bg-slate-900 px-5 font-semibold text-white transition active:scale-95"
      >
        Try again
      </button>
    </div>
  )
}
