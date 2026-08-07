import { getAccountBalances, getCardPortfolio } from '@/lib/queries/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const [accounts, cards] = await Promise.all([getAccountBalances(), getCardPortfolio()])
  return <AccountsClient accounts={accounts} cards={cards} />
}
