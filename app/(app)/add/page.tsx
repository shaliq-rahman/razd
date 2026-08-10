import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { getRecurringPayments } from '@/lib/queries/recurring'
import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/empty-state'
import { WalletScene } from '@/components/illustrations'
import { AddForm } from './add-form'
import type { Category } from '@/lib/types'

export default async function AddPage() {
  const supabase = await createServerSupabase()
  const [accounts, categoriesResult, recurringPayments] = await Promise.all([
    getAccountBalances(),
    supabase.from('categories').select('id, user_id, name, icon, kind, is_default').order('name'),
    getRecurringPayments(),
  ])

  if (accounts.length === 0) {
    return (
      <EmptyState
        art={<WalletScene className="h-32 w-32" />}
        title="Add an account first"
        body="Transactions need an account to belong to."
        action={
          <Link
            href="/accounts"
            prefetch={true}
            className="inline-flex min-h-[48px] items-center rounded-[14px] bg-indigo-600 px-5 font-semibold text-white transition active:scale-95"
          >
            Go to accounts
          </Link>
        }
      />
    )
  }

  return (
    <AddForm
      accounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        card_limit: a.card_limit,
      }))}
      categories={(categoriesResult.data ?? []) as Category[]}
      recurringPayments={recurringPayments.map((payment) => ({
        id: payment.id,
        name: payment.name,
        amount: payment.amount,
        end_date: payment.end_date,
        paid_month: payment.paid_month,
      }))}
    />
  )
}
