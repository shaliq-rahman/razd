'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { CategoryIcon } from '@/components/icons'
import { focusRing } from '@/lib/ui'
import { updateTransaction, type EditTransactionState } from './actions'
import type { AccountType, Category, TransactionWithRefs, TxKind } from '@/lib/types'

const field =
  'ios-field min-h-[52px] w-full rounded-[13px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const labelClass = 'eyebrow mb-2 block'

type AccountOption = { id: string; name: string; type: AccountType }

export function EditTransactionSheet({
  transaction,
  accounts,
  categories,
  onClose,
}: {
  transaction: TransactionWithRefs
  accounts: AccountOption[]
  categories: Category[]
  onClose: () => void
}) {
  const [state, action] = useActionState<EditTransactionState, FormData>(
    updateTransaction,
    {}
  )
  const [kind, setKind] = useState<TxKind>(transaction.kind)
  const [accountId, setAccountId] = useState(transaction.account_id)
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? '')

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  const visibleCategories = categories.filter((c) => c.kind === kind)

  return (
    <Sheet open onClose={onClose} title="Edit transaction" scrollable={false}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={transaction.id} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="account_id" value={accountId} />

        <div className="grid h-11 grid-cols-2 gap-1 rounded-[13px] bg-[#e8e6eb]/80 p-1">
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k)
                setCategoryId('')
              }}
              className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-sm font-semibold capitalize transition ${
                kind === k ? 'bg-[#29242f] text-white shadow-sm' : 'text-[color:var(--text-muted)]'
              } ${focusRing}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${kind === k ? (k === 'expense' ? 'bg-rose-300' : 'bg-emerald-300') : 'bg-[#aaa4ae]'}`} aria-hidden="true" />
              {k}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="edit-transaction-amount" className={labelClass}>Amount</label>
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
          <p id="edit-category-label" className={labelClass}>Category</p>
          <div className="compact-chip-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-labelledby="edit-category-label">
            {visibleCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex h-10 shrink-0 cursor-pointer items-center rounded-[12px] border px-3 text-[13px] transition ${
                  categoryId === c.id
                    ? 'border-[#29242f] bg-[#29242f] font-semibold text-white shadow-sm'
                    : 'border-white/80 bg-white/55 text-[#5f5965]'
                } ${focusRing}`}
              >
                <CategoryIcon name={c.name} className="mr-1.5 h-4 w-4" />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="edit-transaction-account" className={labelClass}>Account</label>
          <select
            id="edit-transaction-account"
            className={field}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-transaction-date" className={labelClass}>Date</label>
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
          <label htmlFor="edit-transaction-note" className={labelClass}>Note</label>
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
