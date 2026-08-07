import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/empty-state'
import { AddForm } from './add-form'
import type { Category } from '@/lib/types'

export default async function AddPage() {
  const supabase = await createServerSupabase()
  const [accounts, categoriesResult] = await Promise.all([
    getAccountBalances(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon="🏦"
        title="Add an account first"
        body="Transactions need an account to belong to."
        action={
          <Link
            href="/accounts"
            className="inline-block rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Go to accounts
          </Link>
        }
      />
    )
  }

  return (
    <AddForm
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={(categoriesResult.data ?? []) as Category[]}
    />
  )
}
