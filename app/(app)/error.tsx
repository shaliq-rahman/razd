'use client'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass mt-10 rounded-3xl px-6 py-10 text-center">
      <div className="mb-3 text-4xl">⚠️</div>
      <h2 className="font-semibold text-slate-900">Something went wrong</h2>
      <p className="mx-auto mt-1 max-w-[30ch] text-sm text-slate-500">
        We could not load this screen. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
      >
        Try again
      </button>
    </div>
  )
}
