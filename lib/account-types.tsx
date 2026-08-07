import type { AccountType } from './types'
import {
  BankIcon,
  CashIcon,
  CardIcon,
  WalletIcon,
  InvestmentIcon,
} from '@/components/icons'

type IconComponent = (props: { className?: string }) => React.ReactElement

export const ACCOUNT_TYPES: {
  value: AccountType
  label: string
  Icon: IconComponent
}[] = [
  { value: 'bank', label: 'Bank', Icon: BankIcon },
  { value: 'cash', label: 'Cash', Icon: CashIcon },
  { value: 'card', label: 'Card', Icon: CardIcon },
  { value: 'wallet', label: 'Wallet', Icon: WalletIcon },
  { value: 'investment', label: 'Investment', Icon: InvestmentIcon },
]

const BY_VALUE = new Map(ACCOUNT_TYPES.map((t) => [t.value, t]))

/** The icon for an account type, falling back to the bank glyph. */
export function AccountTypeIcon({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const Icon = BY_VALUE.get(type as AccountType)?.Icon ?? BankIcon
  return <Icon className={className} />
}

export function accountTypeLabel(type: string): string {
  return BY_VALUE.get(type as AccountType)?.label ?? type
}

/** Swatches offered when creating an account; the first is the default. */
export const ACCOUNT_COLORS = [
  '#4F46E5',
  '#7C3AED',
  '#0D9488',
  '#B45309',
  '#BE123C',
  '#0369A1',
]
