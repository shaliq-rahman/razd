'use client'

import { useRef, useState } from 'react'
import { formatINR } from '@/lib/format'
import { cardAlertClass } from '@/lib/card-alert'
import { dueAlertClass } from '@/lib/due-alert'
import { occurrenceInMonth } from '@/lib/recurring'
import { sumAmounts } from '@/lib/money'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import { focusRing } from '@/lib/ui'
import { EmptyState } from '@/components/empty-state'
import { ReceiptIcon } from '@/components/icons'
import { WalletScene } from '@/components/illustrations'
import { TransactionRow } from '@/components/transaction-row'
import { AccountFormSheet } from './account-form-sheet'
import { CardPaymentSheet } from './card-payment-sheet'
import type { AccountBalance, AccountMonthActivity, CardPortfolioItem } from '@/lib/types'

/**
 * Deep, saturated card faces. Pastels forced grey labels that measured barely
 * 2:1; white on these measures 5.0:1 at worst, so the cards read as real cards
 * and the text is legible. Hierarchy comes from size and weight, never opacity.
 */
const CARD_GRADIENTS = [
  ['#7c3aed', '#4338ca'],
  ['#0f766e', '#0e7490'],
  ['#b45309', '#9f1239'],
  ['#1d4ed8', '#6d28d9'],
  ['#047857', '#115e59'],
  ['#be123c', '#86198f'],
  ['#4338ca', '#7e22ce'],
  ['#0369a1', '#0f766e'],
] as const

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function formatDueDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day)
  )
}

type SheetState =
  | { mode: 'create'; seq: number }
  | { mode: 'edit'; account: AccountBalance; seq: number }
  | null

type AccountView = 'bank' | 'card'

export function AccountsClient({
  accounts,
  cards,
  monthActivity,
}: {
  accounts: AccountBalance[]
  cards: CardPortfolioItem[]
  monthActivity: AccountMonthActivity
}) {
  const [sheet, setSheet] = useState<SheetState>(null)
  const [paymentCard, setPaymentCard] = useState<{
    card: AccountBalance
    utilized: number
  } | null>(null)
  const [seq, setSeq] = useState(0)
  const bankAccounts = accounts.filter((account) => account.type !== 'card')
  const cardAccounts = accounts.filter((account) => account.type === 'card')
  const [view, setView] = useState<AccountView>(bankAccounts.length > 0 ? 'bank' : 'card')
  const visibleAccounts = view === 'bank' ? bankAccounts : cardAccounts
  const [selectedId, setSelectedId] = useState(
    (bankAccounts[0] ?? cardAccounts[0])?.id ?? ''
  )
  const walletRef = useRef<HTMLUListElement>(null)
  const accountRefs = useRef(new Map<string, HTMLLIElement>())
  const scrollFrame = useRef<number | null>(null)

  const openCreate = () => {
    setSeq((number) => number + 1)
    setSheet({ mode: 'create', seq: seq + 1 })
  }
  const openEdit = (account: AccountBalance) => {
    setSeq((number) => number + 1)
    setSheet({ mode: 'edit', account, seq: seq + 1 })
  }

  const selected =
    visibleAccounts.find((account) => account.id === selectedId) ?? visibleAccounts[0]
  const selectedIndex = visibleAccounts.findIndex((account) => account.id === selected?.id)
  const selectedCard = cards.find((card) => card.id === selected?.id)
  const cardLimit = selected?.card_limit ?? selectedCard?.opening_balance ?? 0
  const utilized = selectedCard?.utilized ?? 0
  const today = localToday()
  const selectedDueDate = selected?.due_day
    ? occurrenceInMonth(selected.due_day, today)
    : null
  const totalCardPending = sumAmounts(cards.map((card) => card.utilized))
  const utilization = cardLimit > 0 ? Math.min(100, (utilized / cardLimit) * 100) : 0
  const selectedTransactions = monthActivity[selected?.id] ?? []

  const changeView = (nextView: AccountView) => {
    const nextAccounts = nextView === 'bank' ? bankAccounts : cardAccounts
    setView(nextView)
    setSelectedId(nextAccounts[0]?.id ?? '')
  }

  const selectAccount = (id: string) => {
    setSelectedId(id)
    accountRefs.current.get(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  const syncSelectionToScroll = () => {
    if (scrollFrame.current != null) cancelAnimationFrame(scrollFrame.current)
    scrollFrame.current = requestAnimationFrame(() => {
      const wallet = walletRef.current
      if (!wallet) return
      const center = wallet.getBoundingClientRect().left + wallet.clientWidth / 2
      let closestId = selectedId
      let closestDistance = Number.POSITIVE_INFINITY

      for (const [id, node] of accountRefs.current) {
        const bounds = node.getBoundingClientRect()
        const distance = Math.abs(bounds.left + bounds.width / 2 - center)
        if (distance < closestDistance) {
          closestDistance = distance
          closestId = id
        }
      }
      if (closestId !== selectedId) setSelectedId(closestId)
    })
  }

  return (
    <>
      <div className="accounts-viewport">
      <header className="mb-4 flex shrink-0 items-end justify-between gap-3 pt-1">
        <div>
          <p className="eyebrow mb-1">Your portfolio</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Accounts</h1>
        </div>
        <div className="flex gap-2">
          {selected && (
            <button
              onClick={() => openEdit(selected)}
              aria-label={`Edit ${selected.name}`}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] bg-white/70 text-[#655f6b] shadow-sm transition hover:-translate-y-0.5 ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
                <path d="m13.5 8 3 3" />
              </svg>
            </button>
          )}
          <button
            onClick={openCreate}
            className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[12px] bg-[#1d1a24] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 active:scale-95 ${focusRing}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          art={<WalletScene className="h-32 w-32" />}
          title="No accounts yet"
          body="Add your bank, cash, or card to start tracking your balance."
          action={
            <button
              onClick={openCreate}
              className={`min-h-[48px] cursor-pointer rounded-[14px] bg-[#1d1a24] px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
            >
              Add your first account
            </button>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="relative mx-auto mb-4 grid h-11 w-[190px] shrink-0 grid-cols-2 rounded-full bg-white/50 p-1 shadow-[inset_0_0_0_1px_rgba(95,84,110,0.09)] backdrop-blur-xl"
            role="group"
            aria-label="Account type"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/95 shadow-[0_5px_16px_-8px_rgba(45,38,55,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                view === 'card' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              aria-pressed={view === 'bank'}
              onClick={() => changeView('bank')}
              className={`relative z-10 flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold transition-colors duration-300 active:scale-95 ${
                view === 'bank'
                  ? 'text-violet-700'
                  : 'text-[color:var(--text-muted)]'
              } ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 18h18M12 3l9 5H3l9-5Z" />
              </svg>
              Banks
              <span className="text-[10px] opacity-65">{bankAccounts.length}</span>
            </button>
            <button
              type="button"
              aria-pressed={view === 'card'}
              onClick={() => changeView('card')}
              className={`relative z-10 flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold transition-colors duration-300 active:scale-95 ${
                view === 'card'
                  ? 'text-violet-700'
                  : 'text-[color:var(--text-muted)]'
              } ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M3 10h18M7 15h3" />
              </svg>
              Cards
              <span className="text-[10px] opacity-65">{cardAccounts.length}</span>
            </button>
          </div>

          {!selected ? (
            <div className="flex min-h-0 flex-1 items-start">
              <EmptyState
                art={<WalletScene className="h-24 w-24" />}
                title={view === 'card' ? 'No cards yet' : 'No bank accounts yet'}
                body={view === 'card' ? 'Add a credit card to see it here.' : 'Add a bank, cash, wallet, or investment account to see it here.'}
                action={
                  <button
                    onClick={openCreate}
                    className={`min-h-[46px] cursor-pointer rounded-[14px] bg-[#1d1a24] px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
                  >
                    Add {view === 'card' ? 'card' : 'account'}
                  </button>
                }
              />
            </div>
          ) : (
            <>
          <div className="shrink-0 text-center">
            {view === 'card' && (
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/45 px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                Total pending
                <span className={`text-xs tracking-normal tabular-nums ${cardAlertClass(totalCardPending) || 'text-[#29242f]'}`}>
                  {formatINR(totalCardPending)}
                </span>
              </p>
            )}
            <p className="eyebrow">{selected.type === 'card' ? 'Available on card' : 'Available balance'}</p>
            <p className="mt-2 text-[2.35rem] font-bold tracking-[-0.045em] tabular-nums text-[#24202a]">
              {formatINR(selected.balance)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              {selected.type === 'card' ? (
                <>
                  <span className={cardAlertClass(utilized)}>{formatINR(utilized)} used</span>
                  {' · '}{Math.round(utilization)}% utilized · {formatINR(Math.max(0, cardLimit - utilized))} available
                </>
              ) : (
                `${accountTypeLabel(selected.type)} · ${selected.name}`
              )}
            </p>
            {selected.type === 'card' && selectedDueDate && utilized > 0 && (
              <p className={`mx-auto mt-2 text-xs ${dueAlertClass(selectedDueDate, today) || 'text-[color:var(--text-muted)]'}`}>
                {selectedDueDate < today ? 'Payment overdue' : 'Payment due'} · {formatDueDate(selectedDueDate)}
              </p>
            )}
          </div>

          <div className="account-carousel shrink-0" aria-label="Accounts and cards">
            <ul ref={walletRef} className="account-carousel-scroll" onScroll={syncSelectionToScroll}>
              {visibleAccounts.map((account, index) => {
                const isCard = account.type === 'card'
                const card = cards.find((item) => item.id === account.id)
                const active = account.id === selected.id
                const position = index < selectedIndex ? 'left' : index > selectedIndex ? 'right' : 'center'
                const [gradientFrom, gradientTo] = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
                const cardDueDate = account.due_day
                  ? occurrenceInMonth(account.due_day, today)
                  : null
                const cardPending = card?.utilized ?? 0

                return (
                  <li
                    key={account.id}
                    ref={(node) => {
                      if (node) accountRefs.current.set(account.id, node)
                      else accountRefs.current.delete(account.id)
                    }}
                    className={`account-carousel-item account-carousel-item-${position}`}
                    style={{ zIndex: active ? visibleAccounts.length + 2 : visibleAccounts.length - Math.abs(index - selectedIndex) }}
                  >
                    <button
                      type="button"
                      onClick={() => selectAccount(account.id)}
                      aria-label={`Select ${account.name}`}
                      aria-pressed={active}
                      className={`press relative h-[212px] w-full cursor-pointer overflow-hidden rounded-[13px] border border-white/25 p-5 text-left text-white transition-all duration-500 ${active ? 'ring-2 ring-white/70' : ''} ${focusRing}`}
                      style={{
                        background: `radial-gradient(110% 100% at ${index % 2 === 0 ? '0% 0%' : '100% 0%'}, rgba(255,255,255,.72) 0%, transparent 58%), linear-gradient(${125 + (index % 4) * 12}deg, ${gradientFrom}, ${gradientTo})`,
                        boxShadow: active
                          ? `0 26px 54px -24px color-mix(in srgb, ${account.color} 54%, #4a4251)`
                          : '0 15px 32px -24px rgba(42,36,48,.4)',
                      }}
                    >
                      <span aria-hidden="true" className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
                      <span aria-hidden="true" className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-black/20 blur-3xl" />
                      {/* Engraved arcs, the way a real card catches light */}
                      <svg aria-hidden="true" viewBox="0 0 280 212" className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
                        <path d="M-40 150C40 90 120 190 320 70" stroke="white" strokeOpacity="0.14" strokeWidth="26" />
                        <path d="M-40 186C60 130 150 210 320 110" stroke="white" strokeOpacity="0.09" strokeWidth="18" />
                      </svg>
                      <span className="relative flex h-full flex-col justify-between">
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <span className="block text-[10px] font-bold tracking-[0.17em] text-white uppercase">
                              {isCard ? 'Credit card' : accountTypeLabel(account.type)}
                            </span>
                            <span className="mt-2 block max-w-[13rem] truncate text-xl font-black tracking-[-0.03em] uppercase">{account.name}</span>
                            {isCard && (
                              <span className="mt-1 block text-[10px] font-semibold text-white/75">
                                Limit {formatINR(account.card_limit ?? 0)}
                              </span>
                            )}
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.4)] backdrop-blur-sm">
                            <AccountTypeIcon type={account.type} className="h-5 w-5" />
                          </span>
                        </span>

                        <span
                          aria-hidden="true"
                          className="flex h-7 w-10 items-center justify-center rounded-[7px] bg-gradient-to-br from-amber-200/90 to-amber-400/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]"
                        >
                          <svg viewBox="0 0 24 16" className="h-3.5 w-5" fill="none" stroke="rgba(120,80,10,.55)" strokeWidth="1.2">
                            <rect x="0.6" y="0.6" width="22.8" height="14.8" rx="2.4" />
                            <path d="M0 5.5h7M0 10.5h7M17 5.5h7M17 10.5h7M7 0v16M17 0v16" />
                          </svg>
                        </span>

                        <span className="grid grid-cols-2 gap-4">
                          <span>
                            <span className="block text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
                              {isCard ? 'Pending payment' : 'Balance'}
                            </span>
                            <span className={`mt-1 text-lg font-bold tabular-nums ${isCard ? cardAlertClass(card?.utilized ?? 0) || 'text-white' : 'block text-white'}`}>
                              {formatINR(isCard ? (card?.utilized ?? 0) : account.balance)}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
                              {isCard ? (cardDueDate && cardDueDate < today ? 'Past due' : 'Due date') : 'Opening'}
                            </span>
                            <span className={`mt-1 text-lg font-bold tabular-nums ${
                              isCard && cardDueDate && cardPending > 0
                                ? dueAlertClass(cardDueDate, today) || 'block text-white'
                                : 'block text-white'
                            }`}>
                              {isCard
                                ? cardDueDate ? formatDueDate(cardDueDate) : 'Not set'
                                : formatINR(account.opening_balance)}
                            </span>
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
              {visibleAccounts.map((account) => (
                <span key={account.id} className={`h-1.5 rounded-full transition-all duration-300 ${account.id === selected.id ? 'w-5 bg-[#2c2731]' : 'w-1.5 bg-[#c9c4cc]'}`} />
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] font-semibold tracking-[0.12em] text-[color:var(--text-faint)] uppercase">Swipe left or right</p>
          </div>

          <section className="flex min-h-0 flex-1 flex-col pt-1">
            <div className="mb-3 flex shrink-0 items-end justify-between gap-3">
              <div>
                <p className="eyebrow">This month</p>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#24202a]">
                  {selected.name} activity
                </h2>
              </div>
              {selected.type === 'card' ? (
                <button
                  type="button"
                  onClick={() => setPaymentCard({ card: selected, utilized })}
                  disabled={utilized <= 0}
                  className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-3.5 text-xs font-bold text-white shadow-[0_8px_18px_-10px_rgba(91,47,224,0.7)] transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${focusRing}`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add payment
                </button>
              ) : (
                <span className="rounded-full bg-white/65 px-3 py-1.5 text-xs font-semibold text-[color:var(--text-muted)] shadow-sm">
                  {selectedTransactions.length} {selectedTransactions.length === 1 ? 'transaction' : 'transactions'}
                </span>
              )}
            </div>

            {selectedTransactions.length > 0 ? (
              <ul className="accounts-transactions-scroll surface-card min-h-0 flex-1 divide-y divide-[#dedbe3]/70 overflow-y-auto overscroll-contain rounded-[13px] px-4">
                {selectedTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            ) : (
              <div className="surface-card min-h-0 flex-1 rounded-[13px] px-5 py-7 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#f1eff3] text-[color:var(--text-muted)]">
                  <ReceiptIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-[#403946]">No activity this month</p>
                <p className="mt-1 text-xs text-[#88818e]">Transactions for this account will appear here.</p>
              </div>
            )}
          </section>
            </>
          )}
        </div>
      )}
      </div>

      {sheet && (
        <AccountFormSheet
          key={`${sheet.mode}-${sheet.seq}`}
          open
          onClose={() => setSheet(null)}
          account={sheet.mode === 'edit' ? sheet.account : undefined}
        />
      )}

      {paymentCard && (
        <CardPaymentSheet
          key={`${paymentCard.card.id}-${paymentCard.utilized}`}
          card={paymentCard.card}
          utilized={paymentCard.utilized}
          onClose={() => setPaymentCard(null)}
        />
      )}
    </>
  )
}
