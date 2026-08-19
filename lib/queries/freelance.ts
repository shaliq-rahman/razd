import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import type { FreelanceProjectWithPayments } from '@/lib/types'

const WITH_PAYMENTS =
  '*, freelance_payments(id, user_id, project_id, transaction_id, account_id, amount, occurred_at, note, created_at, accounts(name, color, type))'

/** Every freelance project with its payments, newest project first. */
export async function getFreelanceProjects(): Promise<FreelanceProjectWithPayments[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('freelance_projects')
    .select(WITH_PAYMENTS)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load freelance projects: ${error.message}`)

  const rows = (data ?? []) as unknown as (FreelanceProjectWithPayments & {
    freelance_payments: FreelanceProjectWithPayments['payments']
  })[]

  return rows.map(({ freelance_payments, ...project }) => ({
    ...project,
    quoted_amount: Number(project.quoted_amount),
    payments: [...freelance_payments]
      .map((payment) => ({ ...payment, amount: Number(payment.amount) }))
      .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)),
  }))
}
