import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccountBreakdownSheet } from './account-breakdown-sheet'
import type { AccountBalance } from '@/lib/types'

const acct = (name: string, balance: number): AccountBalance => ({
  id: name,
  user_id: 'u',
  name,
  type: 'bank',
  opening_balance: 0,
  card_limit: null,
  due_day: null,
  minimum_due_paid_month: null,
  color: '#5B8DEF',
  is_archived: false,
  created_at: '',
  balance,
})

const accounts = [acct('HDFC', 45000), acct('Cash', 2500), acct('Card', -1200)]

describe('AccountBreakdownSheet', () => {
  it('renders one row per account', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByText('HDFC')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('shows each account balance formatted in INR', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByText('₹45,000.00')).toBeInTheDocument()
    expect(screen.getByText('-₹1,200.00')).toBeInTheDocument()
  })

  it('shows a total equal to the sum of the listed balances', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByTestId('breakdown-total')).toHaveTextContent('₹46,300.00')
  })

  it('renders nothing when closed', () => {
    render(<AccountBreakdownSheet open={false} onClose={() => {}} accounts={accounts} />)
    expect(screen.queryByText('HDFC')).not.toBeInTheDocument()
  })

  it('totals to zero when every account is empty', () => {
    render(
      <AccountBreakdownSheet open onClose={() => {}} accounts={[acct('A', 0), acct('B', 0)]} />
    )
    expect(screen.getByTestId('breakdown-total')).toHaveTextContent('₹0.00')
  })
})
