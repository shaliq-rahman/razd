import Link from 'next/link'
import { getAllTransactions } from '@/lib/queries/transactions'
import { ChevronLeftIcon } from '@/components/icons'
import { focusRing } from '@/lib/ui'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
  const transactions = await getAllTransactions()

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/"
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

      <TransactionsClient transactions={transactions} />
    </div>
  )
}
