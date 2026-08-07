'use client'

import { useActionState, useEffect, useState } from 'react'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { focusRing } from '@/lib/ui'
import { describeDueDay, paymentTiming } from '@/lib/recurring'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import {
  createRecurringPayment,
  setRecurringPaid,
  deleteRecurringPayment,
  type RecurringState,
} from './actions'
import type { RecurringPaymentWithAccount } from '@/lib/types'

const field =
  'ios-field min-h-[52px] w-full rounded-[18px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

type AccountOption = { id: string; name: string; type: string }
type CardSummary = { id: string; name: string; outstanding: number }

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
    new Date(y, m - 1, d)
  )
}

function PaymentIcon({ name, paid }: { name: string; paid: boolean }) {
  if (paid) {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
  }
  const value = name.toLowerCase()
  if (value.includes('emi') || value.includes('loan')) {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 18h18M12 3 3 7h18l-9-4Z" /></svg>
  }
  if (value.includes('subscription') || value.includes('netflix') || value.includes('prime')) {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7h-7l2.5-2.5M4 17h7l-2.5 2.5M19 7a7 7 0 0 1-1 9M5 17a7 7 0 0 1 1-9" /></svg>
  }
  return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h3v3H8z" /></svg>
}

export function RecurringClient({
  payments,
  accounts,
  cards,
  today,
}: {
  payments: RecurringPaymentWithAccount[]
  accounts: AccountOption[]
  cards: CardSummary[]
  today: string
}) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const rows = payments.map((payment) => ({
    payment,
    timing: paymentTiming(payment, today),
  }))

  // Owed this month: everything not yet settled and not past its end date.
  const outstandingRows = rows.filter((r) => !r.timing.paid && !r.timing.ended)
  const totalDue = sumAmounts(outstandingRows.map((r) => r.payment.amount))
  const overdueCount = outstandingRows.filter((r) => r.timing.overdue).length
  const paidThisMonth = sumAmounts(
    rows.filter((r) => r.timing.paid).map((r) => r.payment.amount)
  )

  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(
    new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1)
  )

  const openForm = () => {
    setFormKey((key) => key + 1)
    setOpen(true)
  }

  return (
    <div className="space-y-4 pt-1">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Monthly commitments</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">
            Recurring payments
          </h1>
        </div>
        <button
          onClick={openForm}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-[16px] bg-[#1d1a24] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition active:scale-95 ${focusRing}`}
        >
          <span className="text-lg leading-none">+</span> Add
        </button>
      </header>

      <section className="hero-card relative overflow-hidden rounded-[25px] px-5 py-4 text-white">
        <div
          aria-hidden="true"
          className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl"
        />
        <p className="relative text-[10px] font-semibold tracking-[0.15em] text-white/50 uppercase">
          Still due in {monthName}
        </p>
        <div className="relative mt-1.5 flex items-end justify-between gap-3">
          <p data-testid="total-due" className="text-[1.7rem] font-bold tracking-tight tabular-nums">{formatINR(totalDue)}</p>
          <p className="pb-1 text-right text-[11px] leading-tight text-white/55">
            {outstandingRows.length} unpaid
            {overdueCount > 0 && ` · ${overdueCount} overdue`}
            {paidThisMonth > 0 && ` · ${formatINR(paidThisMonth)} paid`}
          </p>
        </div>
      </section>

      {cards.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2">Card outstanding</h2>
          <ul className="grid grid-cols-2 gap-2">
            {cards.map((card) => (
              <li key={card.id} className="surface-card rounded-[18px] px-3 py-2.5">
                <p className="truncate text-xs text-[#777180]">{card.name}</p>
                <p
                  data-testid={`card-outstanding-${card.id}`}
                  className="mt-1 font-bold tabular-nums text-[#29242f]"
                >
                  {formatINR(card.outstanding)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map(({ payment, timing }) => {
            const due = timing.overdue || timing.occurrence <= today
            const tone = timing.paid
              ? 'bg-emerald-100 text-emerald-700'
              : timing.ended
                ? 'bg-[#eeeaf1] text-[#655f6b]'
                : timing.overdue
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-violet-100 text-violet-700'

            return (
              <li
                key={payment.id}
                className={`surface-card rounded-[21px] px-3.5 py-3 transition ${
                  timing.paid || timing.ended ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${tone}`}
                  >
                    <PaymentIcon name={payment.name} paid={timing.paid} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-semibold text-[#29242f] ${
                        timing.paid ? 'line-through' : ''
                      }`}
                    >
                      {payment.name}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[11px] ${
                        timing.overdue ? 'font-semibold text-rose-700' : 'text-[#777180]'
                      }`}
                    >
                      {timing.paid
                        ? `Paid for ${monthName}`
                        : timing.ended
                          ? `Ended ${formatShortDate(payment.end_date)}`
                          : timing.overdue
                            ? `Overdue · was due ${formatShortDate(timing.occurrence)}`
                            : `Due ${formatShortDate(timing.occurrence)}`}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#99939e]">
                      {describeDueDay(payment.due_day)}
                      {payment.accounts ? ` · ${payment.accounts.name}` : ''}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold tabular-nums text-[#29242f]">
                      {formatINR(payment.amount)}
                    </span>

                    {!timing.ended && (
                      <form action={setRecurringPaid}>
                        <input type="hidden" name="id" value={payment.id} />
                        <input
                          type="hidden"
                          name="is_paid"
                          value={timing.paid ? 'false' : 'true'}
                        />
                        <button
                          type="submit"
                          className={`mt-1 min-h-[28px] rounded-full px-2.5 text-[10px] font-semibold transition ${
                            timing.paid
                              ? 'bg-[#eeeaf1] text-[#655f6b]'
                              : due
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#eeeaf1] text-[#655f6b]'
                          } ${focusRing}`}
                        >
                          {timing.paid ? 'Mark unpaid' : due ? 'Mark paid' : 'Pay early'}
                        </button>
                      </form>
                    )}
                  </span>
                </div>

                <form action={deleteRecurringPayment} className="mt-0.5 flex justify-end">
                  <input type="hidden" name="id" value={payment.id} />
                  <button
                    type="submit"
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-[#aaa4ae] transition hover:text-rose-700 ${focusRing}`}
                  >
                    Remove
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="surface-card rounded-[30px] px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-violet-100 text-violet-700">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4" />
            </svg>
          </div>
          <h2 className="mt-4 font-bold text-[#29242f]">No recurring payments</h2>
          <p className="mx-auto mt-1 max-w-[30ch] text-sm text-[#777180]">
            Add an EMI, card bill, rent, or subscription and track it month by month.
          </p>
        </div>
      )}

      <Sheet
        key={formKey}
        open={open}
        onClose={() => setOpen(false)}
        title="Add recurring payment"
      >
        {open && (
          <RecurringForm
            key={formKey}
            today={today}
            accounts={accounts}
            onDone={() => setOpen(false)}
          />
        )}
      </Sheet>
    </div>
  )
}

function RecurringForm({
  today,
  accounts,
  onDone,
}: {
  today: string
  accounts: AccountOption[]
  onDone: () => void
}) {
  const [state, action] = useActionState<RecurringState, FormData>(createRecurringPayment, {})
  const [dueDay, setDueDay] = useState(5)

  useEffect(() => {
    if (state.ok) onDone()
  }, [state.ok, onDone])

  const validDay = Number.isFinite(dueDay) && dueDay >= 1 && dueDay <= 31

  return (
    <form action={action} className="space-y-4 pb-2">
      <div>
        <label htmlFor="recurring-name" className="eyebrow mb-2 block">
          Name
        </label>
        <input
          id="recurring-name"
          name="name"
          className={field}
          placeholder="e.g. Home loan EMI"
          required
          maxLength={60}
        />
      </div>

      <div>
        <label htmlFor="recurring-amount" className="eyebrow mb-2 block">
          Amount
        </label>
        <input
          id="recurring-amount"
          name="amount"
          className={field}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label htmlFor="recurring-due-day" className="eyebrow mb-2 block">
          Due day
        </label>
        <input
          id="recurring-due-day"
          name="due_day"
          className={field}
          type="number"
          min="1"
          max="31"
          step="1"
          inputMode="numeric"
          value={Number.isNaN(dueDay) ? '' : dueDay}
          onChange={(event) => setDueDay(event.target.valueAsNumber)}
          required
          aria-describedby="due-day-help"
        />
        <p id="due-day-help" className="mt-1.5 text-xs text-[#777180]">
          {validDay
            ? `Repeats on ${describeDueDay(dueDay)}.`
            : 'Pick a day from 1 to 31.'}
          {validDay && dueDay > 28 && ` Shorter months fall due on their last day.`}
        </p>
      </div>

      <div>
        <label htmlFor="recurring-account" className="eyebrow mb-2 block">
          Pay from
        </label>
        <select id="recurring-account" name="account_id" className={field} defaultValue="">
          <option value="">Not linked — just track it</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#777180]">
          Marking this paid records the payment against the account, so a card&apos;s
          outstanding drops by the amount.
        </p>
      </div>

      <div>
        <label htmlFor="recurring-end-date" className="eyebrow mb-2 block">
          Ends on
        </label>
        <input
          id="recurring-end-date"
          name="end_date"
          className={field}
          type="date"
          min={today}
          defaultValue={today}
          required
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Adding…">Add payment</SubmitButton>
    </form>
  )
}
