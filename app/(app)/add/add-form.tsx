'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createTransaction, type ActionState } from './actions'
import { focusRing } from '@/lib/ui'
import { formatINR } from '@/lib/format'
import type { AccountType, Category, TxKind } from '@/lib/types'

const field =
  'ios-field w-full min-h-[52px] rounded-[13px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const labelClass = 'eyebrow mb-2 block'

type AccountOption = {
  id: string
  name: string
  type: AccountType
  balance: number
  card_limit: number | null
}

type RecurringOption = {
  id: string
  name: string
  amount: number
  end_date: string
  paid_month: string | null
}

type PaymentType = 'regular' | 'recurring' | 'card_payment'

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
  recurringPayments,
}: {
  accounts: AccountOption[]
  categories: Category[]
  recurringPayments: RecurringOption[]
}) {
  const [state, action] = useActionState<ActionState, FormData>(createTransaction, {})
  const [kind, setKind] = useState<TxKind>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('regular')
  const [targetId, setTargetId] = useState('')
  const bankAccounts = accounts.filter((account) => account.type !== 'card')
  const cardAccounts = accounts.filter((account) => account.type === 'card')
  const [accountView, setAccountView] = useState<'bank' | 'card'>(
    bankAccounts.length > 0 ? 'bank' : 'card'
  )
  const visibleAccounts = accountView === 'bank' ? bankAccounts : cardAccounts
  const [accountId, setAccountId] = useState(
    (bankAccounts[0] ?? cardAccounts[0])?.id ?? ''
  )

  const visible = categories.filter((c) => c.kind === kind)
  const today = todayIso()
  const payableCards = cardAccounts.filter(
    (card) => Math.max(0, (card.card_limit ?? 0) - card.balance) > 0
  )
  const payableRecurring = recurringPayments.filter(
    (payment) =>
      payment.end_date >= today && payment.paid_month?.slice(0, 7) !== today.slice(0, 7)
  )

  const selectPaymentType = (nextType: PaymentType) => {
    setPaymentType(nextType)

    if (nextType === 'recurring') {
      const firstPayment = payableRecurring[0]
      setTargetId(firstPayment?.id ?? '')
      setAmount(firstPayment ? String(firstPayment.amount) : '')
      setCategoryId(
        categories.find(
          (category) => category.kind === 'expense' && category.name.toLowerCase() === 'bills'
        )?.id ?? ''
      )
      return
    }

    if (nextType === 'card_payment') {
      setTargetId(payableCards[0]?.id ?? '')
      setCategoryId('')
      setAmount('')
      return
    }

    setTargetId('')
    setCategoryId('')
  }

  const changeAccountView = (nextView: 'bank' | 'card') => {
    const nextAccounts = nextView === 'bank' ? bankAccounts : cardAccounts
    setAccountView(nextView)
    setAccountId(nextAccounts[0]?.id ?? '')
    if (nextView === 'card') selectPaymentType('regular')
  }

  return (
    <form action={action} className="space-y-5 pt-1">
      <header>
        <p className="eyebrow mb-1">New entry</p>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Add transaction</h1>
      </header>

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="payment_type" value={paymentType} />
      <input type="hidden" name="target_id" value={targetId} />

      <div className="grid grid-cols-2 gap-1 rounded-[13px] bg-[#e8e6eb]/80 p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k)
              setCategoryId('')
              if (k === 'income') selectPaymentType('regular')
            }}
            className={`min-h-[44px] cursor-pointer rounded-[12px] text-sm font-semibold capitalize transition ${
              kind === k ? 'bg-white text-[#24202a] shadow-sm' : 'text-[color:var(--text-muted)]'
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
            value={amount}
            readOnly={paymentType === 'recurring'}
            onChange={(event) => setAmount(event.target.value)}
            className="relative min-h-[44px] w-full max-w-[220px] bg-transparent text-center text-4xl font-bold tracking-tight tabular-nums text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      {paymentType === 'regular' && (
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
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="account_id" className="eyebrow">
            Account
          </label>
          <div
            className="relative grid h-9 w-[176px] shrink-0 grid-cols-2 rounded-full bg-white/50 p-1 shadow-[inset_0_0_0_1px_rgba(95,84,110,0.09)] backdrop-blur-xl"
            role="group"
            aria-label="Choose bank account or card"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/95 shadow-[0_4px_12px_-7px_rgba(45,38,55,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                accountView === 'card' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              aria-pressed={accountView === 'bank'}
              onClick={() => changeAccountView('bank')}
              className={`relative z-10 flex min-h-[44px] cursor-pointer items-center justify-center gap-1 rounded-full px-1 text-[11px] font-bold transition-colors duration-300 active:scale-95 ${
                accountView === 'bank' ? 'text-violet-700' : 'text-[color:var(--text-muted)]'
              } ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 18h18M12 3l9 5H3l9-5Z" />
              </svg>
              Bank
              <span className="text-[9px] opacity-60">{bankAccounts.length}</span>
            </button>
            <button
              type="button"
              aria-pressed={accountView === 'card'}
              onClick={() => changeAccountView('card')}
              className={`relative z-10 flex min-h-[44px] cursor-pointer items-center justify-center gap-1 rounded-full px-1 text-[11px] font-bold transition-colors duration-300 active:scale-95 ${
                accountView === 'card' ? 'text-violet-700' : 'text-[color:var(--text-muted)]'
              } ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M3 10h18" />
              </svg>
              Card
              <span className="text-[9px] opacity-60">{cardAccounts.length}</span>
            </button>
          </div>
        </div>
        <select
          id="account_id"
          name="account_id"
          className={field}
          required
          value={accountId}
          disabled={visibleAccounts.length === 0}
          onChange={(event) => setAccountId(event.target.value)}
        >
          {visibleAccounts.length === 0 ? (
            <option value="">No {accountView === 'card' ? 'cards' : 'bank accounts'} added</option>
          ) : (
            visibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))
          )}
        </select>
      </div>

      {kind === 'expense' && accountView === 'bank' && (
        <div className="space-y-3">
          <p id="payment-type-label" className={labelClass}>Pay towards</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="payment-type-label">
            {([
              ['regular', 'Regular'],
              ['recurring', 'Recurring'],
              ['card_payment', 'Credit card'],
            ] as const).map(([value, label]) => {
              const unavailable =
                (value === 'recurring' && payableRecurring.length === 0) ||
                (value === 'card_payment' && payableCards.length === 0)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={paymentType === value}
                  disabled={unavailable}
                  onClick={() => selectPaymentType(value)}
                  className={`min-h-[44px] cursor-pointer rounded-[13px] px-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                    paymentType === value
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'bg-white/45 text-[color:var(--text-muted)]'
                  } ${focusRing}`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {paymentType === 'recurring' && (
            <div>
              <label htmlFor="recurring_target" className={labelClass}>Recurring payment</label>
              <select
                id="recurring_target"
                className={field}
                value={targetId}
                onChange={(event) => {
                  const id = event.target.value
                  const payment = payableRecurring.find((item) => item.id === id)
                  setTargetId(id)
                  setAmount(payment ? String(payment.amount) : '')
                }}
              >
                {payableRecurring.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.name} — {formatINR(payment.amount)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                Paying this marks it complete for the current month.
              </p>
            </div>
          )}

          {paymentType === 'card_payment' && (
            <div>
              <label htmlFor="card_target" className={labelClass}>Credit card</label>
              <select
                id="card_target"
                className={field}
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                {payableCards.map((card) => {
                  const used = Math.max(0, (card.card_limit ?? 0) - card.balance)
                  return (
                    <option key={card.id} value={card.id}>
                      {card.name} — {formatINR(used)} used
                    </option>
                  )
                })}
              </select>
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                Moves money from this account and reduces the card’s used limit.
              </p>
            </div>
          )}
        </div>
      )}

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

      {paymentType === 'regular' && (
        <input name="note" className={field} placeholder="Note (optional)" maxLength={120} />
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save transaction</SubmitButton>
    </form>
  )
}
