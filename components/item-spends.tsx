'use client'

import { useState } from 'react'
import { Sheet } from '@/components/sheet'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import { formatDayLabel, formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { focusRing } from '@/lib/ui'
import type { TransactionWithRefs } from '@/lib/types'

export function ItemSpends({
  transactions,
  compact = false,
}: {
  transactions: TransactionWithRefs[]
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const total = sumAmounts(transactions.map((transaction) => transaction.amount))

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Item spends: ${transactions.length} expenses, ${formatINR(total)}`}
          className={`surface-card press flex h-11 w-11 cursor-pointer items-center justify-center rounded-[13px] text-amber-700 ${focusRing}`}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
            <path d="M9 9h6M9 13h4" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`surface-card group flex min-h-[68px] w-full cursor-pointer items-center gap-3 rounded-[13px] px-4 text-left transition duration-300 hover:-translate-y-0.5 ${focusRing}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-amber-100 text-amber-700">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
              <path d="M9 9h6M9 13h4" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[#29242f]">Item spends</span>
            <span className="mt-0.5 block text-xs text-[color:var(--text-muted)]">
              {transactions.length} {transactions.length === 1 ? 'expense' : 'expenses'} · {formatINR(total)}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-violet-700">
            View
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </span>
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Item spends">
        <div className="mb-4 flex items-end justify-between rounded-[12px] bg-[#f1eff3] px-4 py-3">
          <span className="text-xs font-medium text-[color:var(--text-muted)]">Spent this month</span>
          <span className="text-lg font-bold tabular-nums text-[#29242f]">{formatINR(total)}</span>
        </div>

        {transactions.length > 0 ? (
          <ul className="divide-y divide-[#e6e2e8]">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f1eff3] text-lg" aria-hidden="true">
                  {transaction.categories?.icon ?? '•'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#29242f]">
                    {transaction.note || transaction.categories?.name || 'Expense'}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-[color:var(--text-muted)]">
                    <AccountTypeIcon type={transaction.accounts?.type ?? 'bank'} className="h-3.5 w-3.5" />
                    {transaction.accounts?.name ?? 'Unknown account'} · {accountTypeLabel(transaction.accounts?.type ?? 'bank')} · {formatDayLabel(transaction.occurred_at)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#29242f]">
                  {formatINR(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <p className="font-semibold text-[#403946]">No expenses this month</p>
            <p className="mt-1 text-sm text-[#88818e]">New expenses will appear here with their account.</p>
          </div>
        )}
      </Sheet>
    </>
  )
}
