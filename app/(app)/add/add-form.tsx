'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createTransaction, type ActionState } from './actions'
import type { Category, TxKind } from '@/lib/types'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

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
            className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              kind === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl px-5 py-6 text-center">
        <label htmlFor="amount" className="text-xs font-medium text-slate-500">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-2xl font-bold text-slate-400">₹</span>
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
            className="w-full max-w-[220px] bg-transparent text-center text-4xl font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Category</p>
        <div className="flex flex-wrap gap-2">
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full border px-3.5 py-2 text-sm transition ${
                categoryId === c.id
                  ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account_id" className="text-xs font-medium text-slate-500">
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
        <label htmlFor="occurred_at" className="text-xs font-medium text-slate-500">
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
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save transaction</SubmitButton>
    </form>
  )
}
