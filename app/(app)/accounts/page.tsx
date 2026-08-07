import { getAccountBalances } from '@/lib/queries/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const accounts = await getAccountBalances()
  return <AccountsClient accounts={accounts} />
}
