'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/account-types'
import { createAccount, updateAccount, deleteAccount, type ActionState } from './actions'
import type { AccountBalance } from '@/lib/types'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function AccountFormSheet({
  open,
  onClose,
  account,
}: {
  open: boolean
  onClose: () => void
  account?: AccountBalance
}) {
  const editing = Boolean(account)
  const [state, action] = useActionState<ActionState, FormData>(
    editing ? updateAccount : createAccount,
    {}
  )
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteAccount, {})
  const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = state.ok || deleteState.ok
  useEffect(() => {
    if (done) onClose()
  }, [done, onClose])

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit account' : 'New account'}>
      <form action={action} className="space-y-3 pb-2">
        {editing && <input type="hidden" name="id" value={account!.id} />}
        <input type="hidden" name="color" value={color} />

        <input
          className={field}
          name="name"
          placeholder="Account name"
          defaultValue={account?.name}
          required
          maxLength={50}
        />

        <select className={field} name="type" defaultValue={account?.type ?? 'bank'}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>

        <div>
          <label
            htmlFor="opening_balance"
            className="mb-1.5 block text-xs font-medium text-slate-500"
          >
            Opening balance (before any logged transactions)
          </label>
          <input
            id="opening_balance"
            className={field}
            name="opening_balance"
            type="number"
            step="0.01"
            inputMode="decimal"
            defaultValue={account?.opening_balance ?? 0}
            required
          />
        </div>

        <div className="flex gap-2 pt-1">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={`h-8 w-8 rounded-full transition ${
                color === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''
              }`}
            />
          ))}
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">
          {editing ? 'Save changes' : 'Add account'}
        </SubmitButton>
      </form>

      {editing && (
        <div className="border-t border-slate-100 pt-3">
          {confirmDelete ? (
            <form action={deleteAction} className="space-y-2">
              <input type="hidden" name="id" value={account!.id} />
              <p className="text-sm text-slate-600">
                Delete “{account!.name}”? Its transactions will be deleted too. This cannot be
                undone.
              </p>
              {deleteState.error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                  {deleteState.error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-rose-500 py-3 font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 text-sm font-medium text-rose-500"
            >
              Delete account
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
