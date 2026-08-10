import {
  getAccountBalances,
  getAccountMonthActivity,
  buildCardPortfolio,
} from '@/lib/queries/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const [accounts, monthActivity] = await Promise.all([
    getAccountBalances(),
    getAccountMonthActivity(),
  ])
  const cards = buildCardPortfolio(accounts)
  return <AccountsClient accounts={accounts} cards={cards} monthActivity={monthActivity} />
}
