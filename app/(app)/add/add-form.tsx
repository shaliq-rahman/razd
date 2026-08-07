'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createTransaction, type ActionState } from './actions'
import { focusRing } from '@/lib/ui'
import type { Category, TxKind } from '@/lib/types'

const field =
  'w-full min-h-[48px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'

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
    <form action={action} className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add transaction</h1>

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k)
              setCategoryId('')
            }}
            className={`min-h-[44px] cursor-pointer rounded-xl text-sm font-semibold capitalize transition ${
              kind === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            } ${focusRing}`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl px-5 py-6 text-center">
        <label htmlFor="amount" className="text-xs font-semibold text-slate-600">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-2xl font-bold text-slate-600" aria-hidden="true">₹</span>
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
            className="min-h-[44px] w-full max-w-[220px] bg-transparent text-center text-4xl font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-500"
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
                  ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-800'
                  : 'border-slate-300 bg-white text-slate-700'
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
