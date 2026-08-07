'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/format'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import { focusRing } from '@/lib/ui'
import { EmptyState } from '@/components/empty-state'
import { BankIcon } from '@/components/icons'
import { AccountFormSheet } from './account-form-sheet'
import type { AccountBalance } from '@/lib/types'

type SheetState =
  | { mode: 'create'; seq: number }
  | { mode: 'edit'; account: AccountBalance; seq: number }
  | null

export function AccountsClient({ accounts }: { accounts: AccountBalance[] }) {
  // `seq` increments on every open so the sheet remounts with fresh form state.
  // Without it a previous success flag would survive and close the sheet instantly.
  const [sheet, setSheet] = useState<SheetState>(null)
  const [seq, setSeq] = useState(0)

  const openCreate = () => {
    setSeq((n) => n + 1)
    setSheet({ mode: 'create', seq: seq + 1 })
  }
  const openEdit = (account: AccountBalance) => {
    setSeq((n) => n + 1)
    setSheet({ mode: 'edit', account, seq: seq + 1 })
  }
  const close = () => setSheet(null)

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accounts</h1>
        {accounts.length > 0 && (
          <button
            onClick={openCreate}
            className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition active:scale-95 ${focusRing}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
        )}
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<BankIcon className="h-7 w-7" />}
          title="No accounts yet"
          body="Add your bank, cash, or card to start tracking your balance."
          action={
            <button
              onClick={openCreate}
              className={`min-h-[48px] cursor-pointer rounded-2xl bg-indigo-600 px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
            >
              Add your first account
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => openEdit(a)}
                aria-label={`Edit ${a.name}`}
                className={`glass flex w-full cursor-pointer items-center gap-3 rounded-3xl px-4 py-4 text-left transition active:scale-[0.99] ${focusRing}`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${a.color}1F`, color: a.color }}
                >
                  <AccountTypeIcon type={a.type} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{a.name}</span>
                  <span className="block text-xs text-slate-600">
                    {accountTypeLabel(a.type)}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-bold tabular-nums ${
                    a.balance < 0 ? 'text-rose-700' : 'text-slate-900'
                  }`}
                >
                  {formatINR(a.balance)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet && (
        <AccountFormSheet
          key={`${sheet.mode}-${sheet.seq}`}
          open
          onClose={close}
          account={sheet.mode === 'edit' ? sheet.account : undefined}
        />
      )}
    </>
  )
}
