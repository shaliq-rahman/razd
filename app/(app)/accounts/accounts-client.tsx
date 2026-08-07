'use client'

import { useRef, useState } from 'react'
import { formatINR } from '@/lib/format'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import { focusRing } from '@/lib/ui'
import { EmptyState } from '@/components/empty-state'
import { ReceiptIcon } from '@/components/icons'
import { WalletScene } from '@/components/illustrations'
import { TransactionRow } from '@/components/transaction-row'
import { AccountFormSheet } from './account-form-sheet'
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

type SheetState =
  | { mode: 'create'; seq: number }
  | { mode: 'edit'; account: AccountBalance; seq: number }
  | null

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
  const [seq, setSeq] = useState(0)
  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '')
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

  const selected = accounts.find((account) => account.id === selectedId) ?? accounts[0]
  const selectedIndex = accounts.findIndex((account) => account.id === selected?.id)
  const selectedCard = cards.find((card) => card.id === selected?.id)
  const cardLimit = selected?.card_limit ?? selectedCard?.opening_balance ?? 0
  const utilized = selectedCard?.utilized ?? 0
  const utilization = cardLimit > 0 ? Math.min(100, (utilized / cardLimit) * 100) : 0
  const selectedTransactions = monthActivity[selected?.id] ?? []

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
        {accounts.length > 0 && selected && (
          <div className="flex gap-2">
            <button
              onClick={() => openEdit(selected)}
              aria-label={`Edit ${selected.name}`}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-[16px] bg-white/70 text-[#655f6b] shadow-sm transition hover:-translate-y-0.5 ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
                <path d="m13.5 8 3 3" />
              </svg>
            </button>
            <button
              onClick={openCreate}
              className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[16px] bg-[#1d1a24] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 active:scale-95 ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
          </div>
        )}
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          art={<WalletScene className="h-32 w-32" />}
          title="No accounts yet"
          body="Add your bank, cash, or card to start tracking your balance."
          action={
            <button
              onClick={openCreate}
              className={`min-h-[48px] cursor-pointer rounded-2xl bg-[#1d1a24] px-5 font-semibold text-white transition active:scale-95 ${focusRing}`}
            >
              Add your first account
            </button>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 text-center">
            <p className="eyebrow">{selected.type === 'card' ? 'Available on card' : 'Available balance'}</p>
            <p className="mt-2 text-[2.35rem] font-bold tracking-[-0.045em] tabular-nums text-[#24202a]">
              {formatINR(selected.balance)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              {selected.type === 'card'
                ? `${Math.round(utilization)}% utilized · ${formatINR(Math.max(0, cardLimit - utilized))} available`
                : `${accountTypeLabel(selected.type)} · ${selected.name}`}
            </p>
          </div>

          <div className="account-carousel shrink-0" aria-label="Accounts and cards">
            <ul ref={walletRef} className="account-carousel-scroll" onScroll={syncSelectionToScroll}>
              {accounts.map((account, index) => {
                const isCard = account.type === 'card'
                const card = cards.find((item) => item.id === account.id)
                const active = account.id === selected.id
                const position = index < selectedIndex ? 'left' : index > selectedIndex ? 'right' : 'center'
                const [gradientFrom, gradientTo] = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

                return (
                  <li
                    key={account.id}
                    ref={(node) => {
                      if (node) accountRefs.current.set(account.id, node)
                      else accountRefs.current.delete(account.id)
                    }}
                    className={`account-carousel-item account-carousel-item-${position}`}
                    style={{ zIndex: active ? accounts.length + 2 : accounts.length - Math.abs(index - selectedIndex) }}
                  >
                    <button
                      type="button"
                      onClick={() => selectAccount(account.id)}
                      aria-label={`Select ${account.name}`}
                      aria-pressed={active}
                      className={`press relative h-[212px] w-full cursor-pointer overflow-hidden rounded-[30px] border border-white/25 p-5 text-left text-white transition-all duration-500 ${active ? 'ring-2 ring-white/70' : ''} ${focusRing}`}
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
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.4)] backdrop-blur-sm">
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
                              {isCard ? 'Used' : 'Balance'}
                            </span>
                            <span className="mt-1 block text-lg font-bold tabular-nums text-white">
                              {formatINR(isCard ? (card?.utilized ?? 0) : account.balance)}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
                              {isCard ? 'Total limit' : 'Opening'}
                            </span>
                            <span className="mt-1 block text-lg font-bold tabular-nums text-white">
                              {formatINR(isCard ? (account.card_limit ?? 0) : account.opening_balance)}
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
              {accounts.map((account) => (
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
              <span className="rounded-full bg-white/65 px-3 py-1.5 text-xs font-semibold text-[color:var(--text-muted)] shadow-sm">
                {selectedTransactions.length} {selectedTransactions.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>

            {selectedTransactions.length > 0 ? (
              <ul className="accounts-transactions-scroll surface-card min-h-0 flex-1 divide-y divide-[#dedbe3]/70 overflow-y-auto overscroll-contain rounded-[28px] px-4">
                {selectedTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            ) : (
              <div className="surface-card min-h-0 flex-1 rounded-[28px] px-5 py-7 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#f1eff3] text-[color:var(--text-muted)]">
                  <ReceiptIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-[#403946]">No activity this month</p>
                <p className="mt-1 text-xs text-[#88818e]">Transactions for this account will appear here.</p>
              </div>
            )}
          </section>
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
    </>
  )
}
