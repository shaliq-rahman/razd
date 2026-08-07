'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createTransaction, type ActionState } from './actions'
import { focusRing } from '@/lib/ui'
import type { Category, TxKind } from '@/lib/types'

const field =
  'ios-field w-full min-h-[52px] rounded-[18px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const labelClass = 'eyebrow mb-2 block'

/** Today as YYYY-MM-DD in local time — toISOString() would shift the date in IST. */
function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function AddForm({
  accounts,
  categories,
}: {
  accounts: { id: string; name: string }[]
  categories: Category[]
}) {
  const [state, action] = useActionState<ActionState, FormData>(createTransaction, {})
  const [kind, setKind] = useState<TxKind>('expense')
  const [categoryId, setCategoryId] = useState('')

  const visible = categories.filter((c) => c.kind === kind)

  return (
    <form action={action} className="space-y-6 pt-1">
      <header>
        <p className="eyebrow mb-1">New entry</p>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Add transaction</h1>
      </header>

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="grid grid-cols-2 gap-1 rounded-[18px] bg-[#e8e6eb]/80 p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k)
              setCategoryId('')
            }}
            className={`min-h-[44px] cursor-pointer rounded-[14px] text-sm font-semibold capitalize transition ${
              kind === k ? 'bg-white text-[#24202a] shadow-sm' : 'text-[#777180]'
            } ${focusRing}`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="hero-card relative overflow-hidden rounded-[32px] px-5 py-7 text-center text-white">
        <div aria-hidden="true" className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />
        <label htmlFor="amount" className="relative text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="relative text-2xl font-bold text-white/60" aria-hidden="true">₹</span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            required
            autoFocus
            className="relative min-h-[44px] w-full max-w-[220px] bg-transparent text-center text-4xl font-bold tracking-tight tabular-nums text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p id="category-label" className={labelClass}>Category</p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="category-label">
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={`min-h-[44px] cursor-pointer rounded-full border px-4 text-sm transition ${
                categoryId === c.id
                  ? 'border-violet-500 bg-violet-100/70 font-semibold text-violet-800 shadow-sm'
                  : 'border-white/80 bg-white/60 text-[#645f6b]'
              } ${focusRing}`}
            >
              <span className="mr-1" aria-hidden="true">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account_id" className={labelClass}>
          Account
        </label>
        <select
          id="account_id"
          name="account_id"
          className={field}
          required
          defaultValue={accounts[0]?.id}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="occurred_at" className={labelClass}>
          Date
        </label>
        <input
          id="occurred_at"
          name="occurred_at"
          type="date"
          className={field}
          defaultValue={todayIso()}
          required
        />
      </div>

      <input name="note" className={field} placeholder="Note (optional)" maxLength={120} />

      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save transaction</SubmitButton>
    </form>
  )
}
