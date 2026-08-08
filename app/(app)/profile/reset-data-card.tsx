'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { focusRing } from '@/lib/ui'
import { resetFinanceData, type ResetDataState } from './actions'

export function ResetDataCard() {
  const [confirming, setConfirming] = useState(false)
  const [state, action] = useActionState<ResetDataState, FormData>(resetFinanceData, {})

  return (
    <section className="rounded-[13px] border-2 border-[#191919] bg-rose-100 px-4 py-3.5 shadow-[3px_3px_0_#191919]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-rose-600 text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[#251d21]">Reset all data</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6b3a46]">
            Permanently delete every account, card, transaction, and recurring payment. Your profile and login will remain.
          </p>
        </div>
      </div>

      {state.reset ? (
        <p role="status" className="mt-4 rounded-[12px] border border-emerald-700 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
          All finance data has been reset.
        </p>
      ) : confirming ? (
        <form action={action} className="mt-4 space-y-3 rounded-[12px] border-2 border-[#191919] bg-white p-4">
          <input type="hidden" name="confirmation" value="RESET" />
          <p className="text-sm font-semibold text-[#251d21]">Are you absolutely sure?</p>
          <p className="text-xs leading-relaxed text-[#6b3a46]">This action cannot be undone.</p>
          {state.error && (
            <p role="alert" className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-800">
              {state.error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`min-h-[52px] cursor-pointer rounded-[13px] border-2 border-[#191919] bg-white font-semibold text-[#29242f] transition active:scale-[0.98] ${focusRing}`}
            >
              Cancel
            </button>
            <SubmitButton pendingLabel="Resetting…">Yes, reset</SubmitButton>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`mt-4 min-h-[48px] w-full cursor-pointer rounded-[13px] border-2 border-[#191919] bg-rose-600 font-bold text-white shadow-[2px_2px_0_#191919] transition hover:bg-rose-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${focusRing}`}
        >
          Reset all data
        </button>
      )}
    </section>
  )
}
