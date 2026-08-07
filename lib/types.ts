export type AccountType = 'bank' | 'cash' | 'card' | 'wallet' | 'investment'
export type TxKind = 'income' | 'expense'

export type Profile = {
  id: string
  display_name: string | null
  currency: string
  created_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: AccountType
  opening_balance: number
  color: string
  is_archived: boolean
  created_at: string
}

/** An account row plus its derived balance, from the account_balances view. */
export type AccountBalance = Account & { balance: number }

export type Category = {
  id: string
  user_id: string
  name: string
  icon: string
  kind: TxKind
  is_default: boolean
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  kind: TxKind
  note: string | null
  occurred_at: string
  created_at: string
}

/** A transaction joined with the display fields of its account and category. */
export type TransactionWithRefs = Transaction & {
  accounts: Pick<Account, 'name' | 'color'> | null
  categories: Pick<Category, 'name' | 'icon'> | null
}
