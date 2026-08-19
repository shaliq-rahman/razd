import Link from 'next/link'
import { getAllTransactions } from '@/lib/queries/transactions'
import { getAccountBalances } from '@/lib/queries/balances'
import { createServerSupabase } from '@/lib/supabase/server'
import { ChevronLeftIcon } from '@/components/icons'
import { focusRing } from '@/lib/ui'
import { TransactionsClient } from './transactions-client'
import type { Category } from '@/lib/types'

export default async function TransactionsPage() {
  const supabase = await createServerSupabase()
  const [transactions, accounts, categoriesResult] = await Promise.all([
    getAllTransactions(),
    getAccountBalances(),
    supabase.from('categories').select('id, user_id, name, icon, kind, is_default').order('name'),
  ])

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          prefetch={true}
          aria-label="Back"
          className={`-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 ${focusRing}`}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <p className="eyebrow">Money moves</p>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Transactions</h1>
        </div>
      </header>

      <TransactionsClient
        transactions={transactions}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
        categories={(categoriesResult.data ?? []) as Category[]}
      />
    </div>
  )
}
