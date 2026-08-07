import {
  getAccountBalances,
  getAccountMonthActivity,
  getCardPortfolio,
} from '@/lib/queries/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const [accounts, cards, monthActivity] = await Promise.all([
    getAccountBalances(),
    getCardPortfolio(),
    getAccountMonthActivity(),
  ])
  return <AccountsClient accounts={accounts} cards={cards} monthActivity={monthActivity} />
}
