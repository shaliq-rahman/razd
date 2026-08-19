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
  card_limit: number | null
  due_day: number | null
  minimum_due_paid_month: string | null
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
  accounts: Pick<Account, 'name' | 'color' | 'type'> | null
  categories: Pick<Category, 'name' | 'icon'> | null
}

export type CardExpenseSummary = {
  total: number
  count: number
  recent: TransactionWithRefs[]
}

export type CardPortfolioItem = AccountBalance & {
  utilized: number
  expenseTotal: number
  repaymentTotal: number
  transactionCount: number
  recent: TransactionWithRefs[]
}

export type AccountMonthActivity = Record<string, TransactionWithRefs[]>

export type RecurringPayment = {
  id: string
  user_id: string
  name: string
  amount: number
  /** Day of the month this repeats on, 1-31. */
  due_day: number
  /** When the commitment finishes; nothing is owed after this. */
  end_date: string
  /** First of the month this was last settled for, or null if never. */
  paid_month: string | null
  /** Account the payment settles against, if any. */
  account_id: string | null
  /** Transaction created when it was marked paid, so it can be undone. */
  paid_transaction_id: string | null
  created_at: string
}

/** A recurring payment joined with the account it settles against. */
export type RecurringPaymentWithAccount = RecurringPayment & {
  accounts: Pick<Account, 'name' | 'color' | 'type'> | null
}

export type FreelanceProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled'

export type FreelanceProject = {
  id: string
  user_id: string
  title: string
  client_name: string
  quoted_amount: number
  start_date: string
  end_date: string | null
  description: string | null
  status: FreelanceProjectStatus
  created_at: string
}

export type FreelancePayment = {
  id: string
  user_id: string
  project_id: string
  transaction_id: string | null
  account_id: string
  amount: number
  occurred_at: string
  note: string | null
  created_at: string
}

/** A freelance payment joined with the account it was credited to. */
export type FreelancePaymentWithAccount = FreelancePayment & {
  accounts: Pick<Account, 'name' | 'color' | 'type'> | null
}

/** A freelance project with its payments, newest first. */
export type FreelanceProjectWithPayments = FreelanceProject & {
  payments: FreelancePaymentWithAccount[]
}
