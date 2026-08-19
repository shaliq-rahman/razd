'use client'

import { useState } from 'react'
import { formatINR, formatDayLabel } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { focusRing } from '@/lib/ui'
import { EmptyState } from '@/components/empty-state'
import { WalletScene } from '@/components/illustrations'
import { ProjectFormSheet } from './project-form-sheet'
import { PaymentSheet } from './payment-sheet'
import type {
  AccountType,
  FreelanceProjectStatus,
  FreelanceProjectWithPayments,
  FreelancePaymentWithAccount,
} from '@/lib/types'

type AccountOption = { id: string; name: string; type: AccountType }

const STATUS_TONE: Record<FreelanceProjectStatus, string> = {
  active: 'bg-violet-100 text-violet-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-[#eeeaf1] text-[#655f6b]',
}

const STATUS_LABEL: Record<FreelanceProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

type Stage = 'not_started' | 'partial' | 'paid'

function stageOf(received: number, quoted: number): Stage {
  if (received <= 0) return 'not_started'
  if (received >= quoted) return 'paid'
  return 'partial'
}

const STAGE_TONE: Record<Stage, string> = {
  not_started: 'bg-[#eeeaf1] text-[#655f6b]',
  partial: 'bg-sky-100 text-sky-700',
  paid: 'bg-emerald-100 text-emerald-700',
}

const STAGE_LABEL: Record<Stage, string> = {
  not_started: 'Not started',
  partial: 'Partially paid',
  paid: 'Fully paid',
}

export function FreelanceClient({
  projects,
  accounts,
  today,
}: {
  projects: FreelanceProjectWithPayments[]
  accounts: AccountOption[]
  today: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [projectSheet, setProjectSheet] = useState<
    { mode: 'new' } | { mode: 'edit'; project: FreelanceProjectWithPayments } | null
  >(null)
  const [paymentSheet, setPaymentSheet] = useState<
    | { project: FreelanceProjectWithPayments; payment?: FreelancePaymentWithAccount }
    | null
  >(null)

  const active = projects.filter((p) => p.status !== 'cancelled')
  const totalQuoted = sumAmounts(active.map((p) => p.quoted_amount))
  const totalReceived = sumAmounts(
    active.flatMap((p) => p.payments.map((payment) => payment.amount))
  )
  const totalPending = Math.max(0, totalQuoted - totalReceived)

  return (
    <div className="space-y-4 pt-1">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Freelance</p>
          <h1 className="text-[1.55rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Projects</h1>
        </div>
        <button
          onClick={() => setProjectSheet({ mode: 'new' })}
          className={`press flex min-h-[44px] items-center gap-1.5 rounded-[13px] bg-[#1d1a24] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 ${focusRing}`}
        >
          <span className="text-lg leading-none">+</span> Add
        </button>
      </header>

      <section className="hero-card relative overflow-hidden rounded-[22px] px-4 py-3 text-white">
        <div
          aria-hidden="true"
          className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl"
        />
        <p className="relative text-[11px] font-semibold tracking-[0.15em] text-white/50 uppercase">
          Total quoted, all projects
        </p>
        <p className="relative mt-1 text-[1.6rem] font-bold tracking-tight tabular-nums">
          {formatINR(totalQuoted)}
        </p>
        <div className="relative mt-2.5 grid grid-cols-2 gap-2 border-t border-white/15 pt-2.5 text-[11px] text-white/65">
          <p className="flex items-center justify-between gap-2 rounded-[10px] bg-white/8 px-2.5 py-1.5">
            <span>Received</span>
            <strong className="tabular-nums text-white">{formatINR(totalReceived)}</strong>
          </p>
          <p className="flex items-center justify-between gap-2 rounded-[10px] bg-white/8 px-2.5 py-1.5">
            <span>Pending</span>
            <strong className="tabular-nums text-white">{formatINR(totalPending)}</strong>
          </p>
        </div>
      </section>

      {projects.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="eyebrow">All projects</h2>
            <span className="text-[11px] font-medium text-[color:var(--text-faint)]">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <ul className="stagger space-y-2">
            {projects.map((project) => {
              const received = sumAmounts(project.payments.map((p) => p.amount))
              const pending = Math.max(0, project.quoted_amount - received)
              const stage = stageOf(received, project.quoted_amount)
              const progress = Math.min(100, (received / project.quoted_amount) * 100)
              const expanded = expandedId === project.id

              return (
                <li key={project.id} className="surface-card overflow-hidden rounded-[18px] px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : project.id)}
                    aria-expanded={expanded}
                    className={`flex w-full cursor-pointer items-start gap-2.5 text-left ${focusRing}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[#29242f]">
                          {project.title}
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[project.status]}`}>
                          {STATUS_LABEL[project.status]}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[color:var(--text-muted)]">
                        {project.client_name}
                      </span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#e8e6eb]">
                        <span
                          className="block h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${STAGE_TONE[stage]}`}>
                          {STAGE_LABEL[stage]}
                        </span>
                        <span className="text-[color:var(--text-faint)]">
                          {formatINR(received)} of {formatINR(project.quoted_amount)}
                        </span>
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`mt-0.5 h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-3 border-t border-[#e7e3e9] pt-3">
                      <dl className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-[11px] bg-[#f4f2f5] px-2.5 py-1.5">
                          <dt className="text-[color:var(--text-faint)]">Started</dt>
                          <dd className="font-semibold text-[#29242f]">{formatDayLabel(project.start_date, new Date(today))}</dd>
                        </div>
                        <div className="rounded-[11px] bg-[#f4f2f5] px-2.5 py-1.5">
                          <dt className="text-[color:var(--text-faint)]">Pending</dt>
                          <dd className="font-semibold text-[#29242f]">{formatINR(pending)}</dd>
                        </div>
                      </dl>

                      {project.description && (
                        <p className="text-xs leading-relaxed text-[color:var(--text-muted)]">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <h3 className="eyebrow">Payments</h3>
                        <button
                          type="button"
                          onClick={() => setPaymentSheet({ project })}
                          className={`inline-flex h-8 items-center rounded-[10px] bg-violet-100 px-2.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-200 ${focusRing}`}
                        >
                          + Log payment
                        </button>
                      </div>

                      {project.payments.length === 0 ? (
                        <p className="text-xs text-[color:var(--text-faint)]">No payments logged yet.</p>
                      ) : (
                        <ul className="divide-y divide-[#e7e3e9]">
                          {project.payments.map((payment) => (
                            <li key={payment.id} className="flex items-center gap-2.5 py-2">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-semibold text-[#29242f]">
                                  {formatINR(payment.amount)}
                                  {payment.accounts ? ` · ${payment.accounts.name}` : ''}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-[color:var(--text-faint)]">
                                  {formatDayLabel(payment.occurred_at, new Date(today))}
                                  {payment.note ? ` · ${payment.note}` : ''}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setPaymentSheet({ project, payment })}
                                aria-label="Edit payment"
                                className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[color:var(--text-muted)] transition hover:bg-white hover:text-violet-700 ${focusRing}`}
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        type="button"
                        onClick={() => setProjectSheet({ mode: 'edit', project })}
                        className={`inline-flex h-9 w-full items-center justify-center rounded-[11px] border border-[#e2dee5] text-[11px] font-semibold text-[#29242f] transition hover:bg-[#f4f2f5] ${focusRing}`}
                      >
                        Edit project
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <EmptyState
          art={<WalletScene className="h-32 w-32" />}
          title="No freelance projects yet"
          body="Add a client, the quoted amount, and log payments as they land."
        />
      )}

      <ProjectFormSheet
        key={projectSheet ? (projectSheet.mode === 'edit' ? projectSheet.project.id : 'new') : 'closed'}
        open={projectSheet !== null}
        onClose={() => setProjectSheet(null)}
        project={projectSheet?.mode === 'edit' ? projectSheet.project : undefined}
        today={today}
      />

      {paymentSheet && (
        <PaymentSheet
          key={paymentSheet.payment?.id ?? `new-${paymentSheet.project.id}`}
          open
          onClose={() => setPaymentSheet(null)}
          projectId={paymentSheet.project.id}
          projectTitle={paymentSheet.project.title}
          accounts={accounts}
          today={today}
          payment={paymentSheet.payment}
        />
      )}
    </div>
  )
}
