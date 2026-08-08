'use client'

import { useMemo, useState } from 'react'
import { formatDayLabel } from '@/lib/format'
import { focusRing } from '@/lib/ui'
import { TransactionRow } from '@/components/transaction-row'
import { EmptyState } from '@/components/empty-state'
import { ReceiptScene } from '@/components/illustrations'
import { EditTransactionSheet } from './edit-transaction-sheet'
import type { TransactionWithRefs } from '@/lib/types'

type AccountView = 'bank' | 'card'
type Range = 'month' | 'week' | 'date'

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function currentIsoWeek() {
  const date = new Date()
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = copy.getDay() || 7
  copy.setDate(copy.getDate() + 4 - weekday)
  const yearStart = new Date(copy.getFullYear(), 0, 1)
  const week = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${copy.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function isoWeekBounds(value: string): [string, string] | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const week = Number(match[2])
  const jan4 = new Date(year, 0, 4)
  const jan4Weekday = jan4.getDay() || 7
  const monday = new Date(year, 0, 4 - jan4Weekday + 1 + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
  return [iso(monday), iso(sunday)]
}

function groupByDay(rows: TransactionWithRefs[]): [string, TransactionWithRefs[]][] {
  const groups = new Map<string, TransactionWithRefs[]>()
  for (const transaction of rows) {
    const list = groups.get(transaction.occurred_at) ?? []
    list.push(transaction)
    groups.set(transaction.occurred_at, list)
  }
  return [...groups.entries()]
}

export function TransactionsClient({ transactions }: { transactions: TransactionWithRefs[] }) {
  const hasBankRows = transactions.some((row) => row.accounts?.type !== 'card')
  const [accountView, setAccountView] = useState<AccountView>(hasBankRows ? 'bank' : 'card')
  const [range, setRange] = useState<Range>('month')
  const today = localToday()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [week, setWeek] = useState(currentIsoWeek())
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<TransactionWithRefs | null>(null)

  const filtered = useMemo(() => {
    const weekBounds = isoWeekBounds(week)
    const query = search.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const isCard = transaction.accounts?.type === 'card'
      if (accountView === 'card' ? !isCard : isCard) return false

      if (range === 'month' && !transaction.occurred_at.startsWith(month)) return false
      if (
        range === 'week' &&
        (!weekBounds ||
          transaction.occurred_at < weekBounds[0] ||
          transaction.occurred_at > weekBounds[1])
      ) {
        return false
      }
      if (range === 'date' && transaction.occurred_at !== date) return false

      if (query) {
        const haystack = [
          transaction.note,
          transaction.accounts?.name,
          transaction.categories?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [accountView, date, month, range, search, transactions, week])

  const days = groupByDay(filtered)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="relative grid h-11 w-[184px] shrink-0 grid-cols-2 rounded-full bg-white/50 p-1 shadow-[inset_0_0_0_1px_rgba(95,84,110,0.09)] backdrop-blur-xl"
            role="group"
            aria-label="Transaction account type"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/95 shadow-[0_4px_12px_-7px_rgba(45,38,55,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                accountView === 'card' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            {(['bank', 'card'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={accountView === value}
                onClick={() => setAccountView(value)}
                className={`relative z-10 flex min-h-[44px] cursor-pointer items-center justify-center rounded-full text-xs font-bold capitalize transition-colors duration-300 active:scale-95 ${
                  accountView === value ? 'text-violet-700' : 'text-[color:var(--text-muted)]'
                } ${focusRing}`}
              >
                {value === 'bank' ? 'Bank' : 'Cards'}
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search transaction notes</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="ios-field h-11 w-full rounded-full bg-white/65 pr-3 pl-10 text-sm outline-none focus:border-violet-400"
            />
          </label>
        </div>

        <section className="rounded-[13px] bg-white/45 p-2 shadow-[inset_0_0_0_1px_rgba(95,84,110,0.07)]">
          <div className="grid grid-cols-3 gap-1">
            {(['month', 'week', 'date'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className={`min-h-[44px] cursor-pointer rounded-[12px] text-xs font-bold capitalize transition ${
                  range === value
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-[color:var(--text-muted)]'
                } ${focusRing}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="mt-2">
            {range === 'month' && (
              <input aria-label="Filter month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="ios-field min-h-[44px] w-full rounded-[13px] px-3 text-sm outline-none" />
            )}
            {range === 'week' && (
              <input aria-label="Filter week" type="week" value={week} onChange={(event) => setWeek(event.target.value)} className="ios-field min-h-[44px] w-full rounded-[13px] px-3 text-sm outline-none" />
            )}
            {range === 'date' && (
              <input aria-label="Filter date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="ios-field min-h-[44px] w-full rounded-[13px] px-3 text-sm outline-none" />
            )}
          </div>
        </section>

        <div className="flex items-center justify-between px-1">
          <p className="eyebrow">Transactions</p>
          <p className="text-xs font-semibold text-[color:var(--text-muted)]">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>
        </div>

        {days.length === 0 ? (
          <EmptyState
            art={<ReceiptScene className="h-24 w-24" />}
            title="No matching transactions"
            body="Try another account type, period, or note search."
          />
        ) : (
          days.map(([day, rows]) => (
            <section key={day}>
              <h2 className="eyebrow mb-2 px-1">{formatDayLabel(day)}</h2>
              <ul className="surface-card animate-rise divide-y divide-[#dedbe3]/70 rounded-[24px] px-4">
                {rows.map((transaction) => {
                  const isCardTransfer = transaction.note?.startsWith('Card payment:')
                  return (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      showDate={false}
                      onEdit={isCardTransfer ? undefined : () => setEditing(transaction)}
                    />
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {editing && (
        <EditTransactionSheet
          key={editing.id}
          transaction={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
