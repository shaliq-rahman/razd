import { getFreelanceProjects } from '@/lib/queries/freelance'
import { getAccountBalances } from '@/lib/queries/balances'
import { FreelanceClient } from './freelance-client'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export default async function FreelancePage() {
  const [projects, accounts] = await Promise.all([getFreelanceProjects(), getAccountBalances()])

  return (
    <FreelanceClient
      projects={projects}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
      today={todayIso()}
    />
  )
}
