'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { focusRing } from '@/lib/ui'
import { addPayment, updatePayment, deletePayment, type ActionState } from './actions'
import type { AccountType, FreelancePaymentWithAccount } from '@/lib/types'

const field =
  'ios-field w-full min-h-[52px] rounded-[13px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const label = 'eyebrow mb-2 block'

type AccountOption = { id: string; name: string; type: AccountType }

export function PaymentSheet({
  open,
  onClose,
  projectId,
  projectTitle,
  accounts,
  today,
  payment,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  accounts: AccountOption[]
  today: string
  payment?: FreelancePaymentWithAccount
}) {
  const editing = Boolean(payment)
  const [state, action] = useActionState<ActionState, FormData>(
    editing ? updatePayment : addPayment,
    {}
  )
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deletePayment, {})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = state.ok || deleteState.ok
  useEffect(() => {
    if (done) onClose()
  }, [done, onClose])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit payment' : `Log payment · ${projectTitle}`}
    >
      <form action={action} className="space-y-4 pb-2">
        {editing && <input type="hidden" name="id" value={payment!.id} />}
        <input type="hidden" name="project_id" value={projectId} />

        <div>
          <label htmlFor="payment-amount" className={label}>Amount received</label>
          <input
            id="payment-amount"
            name="amount"
            className={field}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            defaultValue={payment?.amount}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="payment-account" className={label}>Credited to</label>
          <select
            id="payment-account"
            name="account_id"
            className={field}
            defaultValue={payment?.account_id ?? accounts[0]?.id ?? ''}
            required
            disabled={accounts.length === 0}
          >
            {accounts.length === 0 ? (
              <option value="">Add an account first</option>
            ) : (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="payment-date" className={label}>Date</label>
          <input
            id="payment-date"
            name="occurred_at"
            className={field}
            type="date"
            defaultValue={payment?.occurred_at ?? today}
            required
          />
        </div>

        <div>
          <label htmlFor="payment-note" className={label}>
            Note <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="payment-note"
            name="note"
            className={field}
            placeholder="Advance, milestone 1…"
            defaultValue={payment?.note ?? ''}
            maxLength={120}
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">
          {editing ? 'Save changes' : 'Log payment'}
        </SubmitButton>
      </form>

      {editing && (
        <div className="mt-2 border-t border-slate-200 pt-3">
          {confirmDelete ? (
            <form action={deleteAction} className="space-y-2">
              <input type="hidden" name="id" value={payment!.id} />
              <p className="text-sm text-slate-700">
                Delete this payment? Its linked income transaction will be removed too. This
                cannot be undone.
              </p>
              {deleteState.error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                  {deleteState.error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-[14px] border border-slate-300 font-medium text-slate-700 transition active:scale-[0.98] ${focusRing}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-[14px] bg-rose-600 font-semibold text-white transition active:scale-[0.98] ${focusRing}`}
                >
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`min-h-[44px] w-full cursor-pointer rounded-[14px] text-sm font-semibold text-rose-700 transition hover:bg-rose-50 ${focusRing}`}
            >
              Delete payment
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
