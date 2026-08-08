'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { formatINR } from '@/lib/format'
import { cardAlertClass } from '@/lib/card-alert'
import { focusRing } from '@/lib/ui'
import { addCardPayment, type ActionState } from './actions'
import type { AccountBalance } from '@/lib/types'

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export function CardPaymentSheet({
  card,
  utilized,
  onClose,
}: {
  card: AccountBalance
  utilized: number
  onClose: () => void
}) {
  const [state, action] = useActionState<ActionState, FormData>(addCardPayment, {})
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  const fullAmount = utilized.toFixed(2)

  return (
    <Sheet open onClose={onClose} title="Add card payment" scrollable={false}>
      <div className="mb-4 flex items-center justify-between rounded-[12px] bg-violet-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#29242f]">{card.name}</p>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">Currently used</p>
        </div>
        <p className={`shrink-0 text-lg font-bold tabular-nums ${cardAlertClass(utilized) || 'text-violet-700'}`}>
          {formatINR(utilized)}
        </p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="account_id" value={card.id} />
        <input type="hidden" name="occurred_at" value={localToday()} />

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="card-payment-amount" className="eyebrow">
              Payment amount
            </label>
            <button
              type="button"
              onClick={() => setAmount(fullAmount)}
              className={`cursor-pointer rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-200 active:scale-95 ${focusRing}`}
            >
              Pay full
            </button>
          </div>
          <div className="ios-field flex min-h-[56px] items-center rounded-[13px] px-4 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-100">
            <span className="mr-2 text-lg font-semibold text-[color:var(--text-muted)]">₹</span>
            <input
              id="card-payment-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              max={fullAmount}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-xl font-bold tabular-nums text-[#24202a] outline-none"
              required
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-muted)]">
            This increases available credit and reduces the card’s used limit.
          </p>
        </div>

        {state.error && (
          <p role="alert" className="rounded-[12px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Adding payment…">Add payment</SubmitButton>
      </form>
    </Sheet>
  )
}
