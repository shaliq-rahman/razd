import type { AccountType } from './types'

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'investment', label: 'Investment', icon: '📈' },
]

const ICONS = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, t.icon]))

export function accountIcon(type: string): string {
  return ICONS[type] ?? '📦'
}

/** Swatches offered when creating an account; the first is the default. */
export const ACCOUNT_COLORS = [
  '#5B8DEF',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#0EA5E9',
]
