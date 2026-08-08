'use client'

import { useActionState, useEffect } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { formatINR } from '@/lib/format'
import { updateTransaction, type EditTransactionState } from './actions'
import type { TransactionWithRefs } from '@/lib/types'

const field =
  'ios-field min-h-[52px] w-full rounded-[13px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

export function EditTransactionSheet({
  transaction,
  onClose,
}: {
  transaction: TransactionWithRefs
  onClose: () => void
}) {
  const [state, action] = useActionState<EditTransactionState, FormData>(
    updateTransaction,
    {}
  )

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet open onClose={onClose} title="Edit transaction" scrollable={false}>
      <div className="mb-4 flex items-center justify-between rounded-[13px] bg-violet-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#29242f]">
            {transaction.accounts?.name ?? 'Account'}
          </p>
          <p className="mt-0.5 text-xs capitalize text-[color:var(--text-muted)]">
            {transaction.kind}
          </p>
        </div>
        <p className="font-bold tabular-nums text-violet-700">{formatINR(transaction.amount)}</p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={transaction.id} />

        <div>
          <label htmlFor="edit-transaction-amount" className="eyebrow mb-2 block">Amount</label>
          <input
            id="edit-transaction-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            defaultValue={transaction.amount}
            className={field}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="edit-transaction-date" className="eyebrow mb-2 block">Date</label>
          <input
            id="edit-transaction-date"
            name="occurred_at"
            type="date"
            defaultValue={transaction.occurred_at}
            className={field}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-transaction-note" className="eyebrow mb-2 block">Note</label>
          <input
            id="edit-transaction-note"
            name="note"
            defaultValue={transaction.note ?? ''}
            placeholder="Add a note"
            maxLength={120}
            className={field}
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-[12px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </form>
    </Sheet>
  )
}
