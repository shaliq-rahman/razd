'use client'

import { useRef, useState } from 'react'
import { formatINR } from '@/lib/format'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import { focusRing } from '@/lib/ui'
import { EmptyState } from '@/components/empty-state'
import { BankIcon } from '@/components/icons'
import { AccountFormSheet } from './account-form-sheet'
import type { AccountBalance, CardPortfolioItem } from '@/lib/types'

type SheetState =
  | { mode: 'create'; seq: number }
  | { mode: 'edit'; account: AccountBalance; seq: number }
  | null

function ordinal(day: number) {
  const suffix = day % 10 === 1 && day % 100 !== 11
    ? 'st'
    : day % 10 === 2 && day % 100 !== 12
      ? 'nd'
      : day % 10 === 3 && day % 100 !== 13
        ? 'rd'
        : 'th'
  return `${day}${suffix}`
}

export function AccountsClient({
  accounts,
  cards,
}: {
  accounts: AccountBalance[]
  cards: CardPortfolioItem[]
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
      <header className="mb-5 flex items-end justify-between gap-3 pt-1">
        <div>
          <p className="eyebrow mb-1">Your portfolio</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Accounts</h1>
        </div>
        {accounts.length > 0 && (
          <button
            onClick={openCreate}
            className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[16px] bg-[#1d1a24] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 active:scale-95 ${focusRing}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
        )}
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<BankIcon className="h-7 w-7" />}
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
        <>
          <div className="text-center">
            <p className="eyebrow">{selected.type === 'card' ? 'Available on card' : 'Available balance'}</p>
            <p className="mt-2 text-[2.35rem] font-bold tracking-[-0.045em] tabular-nums text-[#24202a]">
              {formatINR(selected.balance)}
            </p>
            <p className="mt-1 text-sm text-[#777180]">
              {selected.type === 'card'
                ? `${Math.round(utilization)}% utilized · ${formatINR(Math.max(0, cardLimit - utilized))} available`
                : `${accountTypeLabel(selected.type)} · ${selected.name}`}
            </p>
          </div>

          <div className="account-carousel" aria-label="Accounts and cards">
            <ul ref={walletRef} className="account-carousel-scroll" onScroll={syncSelectionToScroll}>
              {accounts.map((account, index) => {
                const isCard = account.type === 'card'
                const card = cards.find((item) => item.id === account.id)
                const active = account.id === selected.id
                const position = index < selectedIndex ? 'left' : index > selectedIndex ? 'right' : 'center'

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
                      className={`relative h-[224px] w-full cursor-pointer overflow-hidden rounded-[30px] border border-white/85 p-5 text-left text-[#25212b] transition-all duration-500 active:scale-[0.98] ${active ? 'ring-2 ring-white/90' : ''} ${focusRing}`}
                      style={{
                        background: isCard
                          ? `radial-gradient(100% 100% at 0% 0%, color-mix(in srgb, ${account.color} 38%, white) 0%, transparent 66%), linear-gradient(145deg, color-mix(in srgb, ${account.color} 52%, white), color-mix(in srgb, ${account.color} 22%, white))`
                          : `radial-gradient(100% 110% at 100% 0%, color-mix(in srgb, ${account.color} 26%, white) 0%, transparent 66%), linear-gradient(145deg, #ffffff, color-mix(in srgb, ${account.color} 13%, #f5f3f6))`,
                        boxShadow: active
                          ? `0 26px 54px -24px color-mix(in srgb, ${account.color} 46%, #4a4251)`
                          : '0 15px 32px -24px rgba(42,36,48,.4)',
                      }}
                    >
                      <span aria-hidden="true" className="absolute -top-16 -right-14 h-44 w-44 rounded-full bg-white/35 blur-3xl" />
                      <span className="relative flex h-full flex-col justify-between">
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <span className="block text-[10px] font-bold tracking-[0.17em] text-[#5f5865]/65 uppercase">
                              {isCard ? 'Credit card' : accountTypeLabel(account.type)}
                            </span>
                            <span className="mt-2 block max-w-[13rem] truncate text-xl font-black tracking-[-0.03em] uppercase">{account.name}</span>
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white/38 shadow-[inset_0_0_0_1px_rgba(255,255,255,.45)]" style={{ color: account.color }}>
                            <AccountTypeIcon type={account.type} className="h-5 w-5" />
                          </span>
                        </span>

                        <span className="grid grid-cols-2 gap-4">
                          <span>
                            <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#5f5865]/65 uppercase">
                              {isCard ? 'Used' : 'Balance'}
                            </span>
                            <span className={`mt-1 block text-lg font-bold tabular-nums ${!isCard && account.balance < 0 ? 'text-rose-700' : ''}`}>
                              {formatINR(isCard ? (card?.utilized ?? 0) : account.balance)}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#5f5865]/65 uppercase">
                              {isCard ? 'Total limit' : 'Opening'}
                            </span>
                            <span className="mt-1 block text-lg font-bold tabular-nums">
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
            <p className="mt-2 text-center text-[10px] font-semibold tracking-[0.12em] text-[#99939e] uppercase">Swipe left or right</p>
          </div>

          {selected.type === 'card' ? (
            <section className="animate-rise overflow-hidden rounded-[30px] bg-[#201c26] p-5 text-white shadow-[0_22px_48px_-28px_rgba(29,24,37,.75)]" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">Card overview</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">{selected.name}</h2>
                </div>
                <button onClick={() => openEdit(selected)} className={`min-h-[40px] rounded-[14px] bg-white/10 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/15 ${focusRing}`}>Edit</button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[20px] bg-white/8 p-4">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">Used amount</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{formatINR(utilized)}</p>
                </div>
                <div className="rounded-[20px] bg-white/8 p-4">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">Total limit</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{formatINR(cardLimit)}</p>
                </div>
                <div className="rounded-[20px] bg-white/8 p-4">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">Balance</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{formatINR(selected.balance)}</p>
                </div>
                <div className="rounded-[20px] bg-white/8 p-4">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">Due date</p>
                  <p className="mt-1.5 text-lg font-bold">{selected.due_day ? `${ordinal(selected.due_day)} monthly` : 'Not set'}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-medium text-white/55">
                  <span>Utilized</span>
                  <span>{Math.round(utilization)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${utilization}%` }} />
                </div>
              </div>
            </section>
          ) : (
            <section className="surface-card animate-rise rounded-[30px] p-5" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{accountTypeLabel(selected.type)} account</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[#29242f]">{selected.name}</h2>
                </div>
                <button onClick={() => openEdit(selected)} className={`min-h-[40px] rounded-[14px] bg-[#eeeaf1] px-3 text-xs font-semibold text-[#5d5664] transition hover:bg-[#e6e1e9] ${focusRing}`}>Edit</button>
              </div>
              <div className="mt-6 rounded-[24px] bg-[#f1eff3] p-5">
                <p className="text-xs font-medium text-[#777180]">Available balance</p>
                <p className={`mt-1 text-3xl font-bold tracking-[-0.03em] tabular-nums ${selected.balance < 0 ? 'text-rose-700' : 'text-[#29242f]'}`}>{formatINR(selected.balance)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[#dfdbe2] pt-4 text-sm">
                  <span className="text-[#777180]">Opening balance</span>
                  <span className="font-semibold tabular-nums text-[#403946]">{formatINR(selected.opening_balance)}</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}

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
