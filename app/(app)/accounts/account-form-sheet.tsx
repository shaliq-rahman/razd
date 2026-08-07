'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/account-types'
import { focusRing } from '@/lib/ui'
import { createAccount, updateAccount, deleteAccount, type ActionState } from './actions'
import type { AccountBalance } from '@/lib/types'

const field =
  'ios-field w-full min-h-[52px] rounded-[18px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const label = 'eyebrow mb-2 block'

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
  const [accountType, setAccountType] = useState(account?.type ?? 'bank')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = state.ok || deleteState.ok
  useEffect(() => {
    if (done) onClose()
  }, [done, onClose])

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit account' : 'New account'}>
      <form action={action} className="space-y-4 pb-2">
        {editing && <input type="hidden" name="id" value={account!.id} />}
        <input type="hidden" name="color" value={color} />

        <div>
          <label htmlFor="account-name" className={label}>
            Account name
          </label>
          <input
            id="account-name"
            className={field}
            name="name"
            placeholder="e.g. HDFC Savings"
            defaultValue={account?.name}
            required
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="account-type" className={label}>
            Type
          </label>
          <select
            id="account-type"
            className={field}
            name="type"
            value={accountType}
            onChange={(event) => setAccountType(event.target.value as AccountBalance['type'])}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {accountType === 'card' && (
          <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-violet-100 bg-violet-50/60 p-4">
            <div>
              <label htmlFor="card_limit" className={label}>Total limit</label>
              <input
                id="card_limit"
                className={field}
                name="card_limit"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                defaultValue={account?.card_limit ?? Math.max(account?.opening_balance ?? 0, 0)}
                required
              />
            </div>
            <div>
              <label htmlFor="due_day" className={label}>Due day</label>
              <input
                id="due_day"
                className={field}
                name="due_day"
                type="number"
                min="1"
                max="31"
                inputMode="numeric"
                defaultValue={account?.due_day ?? 1}
                required
              />
            </div>
          </div>
        )}

        {accountType !== 'card' && (
          <>
            <input type="hidden" name="card_limit" value="" />
            <input type="hidden" name="due_day" value="" />
          </>
        )}

        <div>
          <label htmlFor="opening_balance" className={label}>
            Opening balance
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
            aria-describedby="opening-balance-help"
          />
          <p id="opening-balance-help" className="mt-1.5 text-xs text-slate-600">
            {accountType === 'card'
              ? 'Enter the currently available card balance.'
              : 'The balance before any transactions you log here.'}
          </p>
        </div>

        <fieldset>
          <legend className={label}>Colour</legend>
          <div className="flex flex-wrap gap-1">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                // 44px tap target; the swatch itself stays visually small.
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition ${focusRing}`}
              >
                <span
                  style={{ background: c }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition ${
                    color === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                >
                  {color === c && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">
          {editing ? 'Save changes' : 'Add account'}
        </SubmitButton>
      </form>

      {editing && (
        <div className="mt-2 border-t border-slate-200 pt-3">
          {confirmDelete ? (
            <form action={deleteAction} className="space-y-2">
              <input type="hidden" name="id" value={account!.id} />
              <p className="text-sm text-slate-700">
                Delete “{account!.name}”? Its transactions will be deleted too. This cannot be
                undone.
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
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-2xl border border-slate-300 font-medium text-slate-700 transition active:scale-[0.98] ${focusRing}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-2xl bg-rose-600 font-semibold text-white transition active:scale-[0.98] ${focusRing}`}
                >
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`min-h-[44px] w-full cursor-pointer rounded-2xl text-sm font-semibold text-rose-700 transition hover:bg-rose-50 ${focusRing}`}
            >
              Delete account
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
