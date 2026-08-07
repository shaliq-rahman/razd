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
import type { AccountBalance } from '@/lib/types'

export function BalanceCard({ accounts }: { accounts: AccountBalance[] }) {
  const [open, setOpen] = useState(false)
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const total = sumAmounts(accounts.map((a) => a.balance))

  return (
    <>
      <section className="glass relative overflow-hidden rounded-[28px] px-6 py-7">
        <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-400/35 to-violet-400/25 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">Total balance</p>
          <div className="flex gap-1">
            <button
              onClick={() => setHideAmounts(!hidden)}
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              className="rounded-full p-1.5 text-slate-400 transition active:scale-90"
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
              className="rounded-full p-1.5 text-slate-400 transition active:scale-90"
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
          className={`relative mt-2 font-bold tracking-tight tabular-nums ${
            total < 0 ? 'text-rose-500' : 'text-slate-900'
          } ${hidden ? 'text-3xl' : 'text-[clamp(1.9rem,9vw,2.6rem)]'}`}
        >
          {hidden ? '••••••' : formatINR(total)}
        </p>

        <button
          onClick={() => setOpen(true)}
          className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition active:scale-95"
        >
          Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          <span aria-hidden>›</span>
        </button>
      </section>

      <AccountBreakdownSheet open={open} onClose={() => setOpen(false)} accounts={accounts} />
    </>
  )
}
