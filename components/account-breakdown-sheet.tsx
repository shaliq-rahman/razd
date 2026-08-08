'use client'

import { Sheet } from './sheet'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { AccountTypeIcon, accountTypeLabel } from '@/lib/account-types'
import type { AccountBalance } from '@/lib/types'

/**
 * The per-account breakdown behind the home screen's ⓘ button. It sums the same
 * rows it lists, so the total here can never disagree with the rows above it.
 */
export function AccountBreakdownSheet({
  open,
  onClose,
  accounts,
}: {
  open: boolean
  onClose: () => void
  accounts: AccountBalance[]
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Balance by account">
      <ul className="space-y-1">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-[14px] px-1 py-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${a.color}1F`, color: a.color }}
            >
              <AccountTypeIcon type={a.type} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900">{a.name}</span>
              <span className="block text-xs text-slate-600">{accountTypeLabel(a.type)}</span>
            </span>
            <span
              className={`shrink-0 font-semibold tabular-nums ${
                a.balance < 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatINR(a.balance)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-medium text-slate-600">Total</span>
        <span
          data-testid="breakdown-total"
          className="text-lg font-bold tabular-nums text-slate-900"
        >
          {formatINR(sumAmounts(accounts.map((a) => a.balance)))}
        </span>
      </div>
    </Sheet>
  )
}
