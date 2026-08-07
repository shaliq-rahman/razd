'use client'

import { useState, useSyncExternalStore } from 'react'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setHideAmounts,
} from '@/lib/hide-amounts'
import { AccountBreakdownSheet } from './account-breakdown-sheet'
import { focusRing } from '@/lib/ui'
import type { AccountBalance } from '@/lib/types'

export function BalanceCard({ accounts }: { accounts: AccountBalance[] }) {
  const [open, setOpen] = useState(false)
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const total = sumAmounts(accounts.map((a) => a.balance))

  return (
    <>
      <section className="glass relative overflow-hidden rounded-[28px] px-6 pt-5 pb-5">
        <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-400/35 to-violet-400/25 blur-2xl" />

        <div className="relative -mt-1.5 flex items-start justify-between">
          <p className="mt-2.5 text-sm font-medium text-slate-600">Total balance</p>
          {/* 44px tap targets with an 8px gap, per platform minimums. */}
          <div className="-mr-2 flex gap-2">
            <button
              onClick={() => setHideAmounts(!hidden)}
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              aria-pressed={hidden}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-white/70 active:scale-90 ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
                {hidden && <path d="m4 4 16 16" strokeLinecap="round" />}
              </svg>
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Show balance by account"
              aria-haspopup="dialog"
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-white/70 active:scale-90 ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <p
          data-testid="total-balance"
          className={`relative -mt-1 font-bold tracking-tight tabular-nums ${
            total < 0 ? 'text-rose-700' : 'text-slate-900'
          } ${hidden ? 'text-3xl' : 'text-[clamp(1.9rem,9vw,2.6rem)]'}`}
        >
          {hidden ? '••••••' : formatINR(total)}
        </p>

        <button
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`relative -mb-1 -ml-2 inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-full px-2 text-xs font-medium text-slate-700 transition hover:bg-white/70 active:scale-95 ${focusRing}`}
        >
          Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </section>

      <AccountBreakdownSheet open={open} onClose={() => setOpen(false)} accounts={accounts} />
    </>
  )
}
