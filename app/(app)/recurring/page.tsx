import { getRecurringPayments } from '@/lib/queries/recurring'
import { getCardPortfolio } from '@/lib/queries/balances'
import { getAccountBalances } from '@/lib/queries/balances'
import { RecurringClient } from './recurring-client'

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export default async function RecurringPage() {
  const [payments, accounts, cards] = await Promise.all([
    getRecurringPayments(),
    getAccountBalances(),
    getCardPortfolio(),
  ])

  return (
    <RecurringClient
      payments={payments}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
      cards={cards.map((c) => ({
        id: c.id,
        name: c.name,
        outstanding: c.utilized,
        dueDay: c.due_day,
        minimumDuePaidMonth: c.minimum_due_paid_month,
      }))}
      today={localDate()}
    />
  )
}
