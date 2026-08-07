/**
 * Icon set. Single visual language: 24px grid, 1.75 stroke, round caps and
 * joins, no fills. Emoji are not used for interface chrome — they render
 * differently per platform and cannot be themed or sized reliably.
 *
 * Category icons remain emoji because they are per-user data stored in the
 * database, closer to an avatar than to interface furniture.
 */
type IconProps = { className?: string }

function Svg({ className = 'h-6 w-6', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function BankIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 10h18M5 10v8m5-8v8m4-8v8m5-8v8M3 18h18M12 3 3 7.5h18L12 3Z" />
    </Svg>
  )
}

export function CashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Svg>
  )
}

export function CardIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20M6 15h4" />
    </Svg>
  )
}

export function WalletIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M3 7h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5" />
      <path d="M16.5 13h.01" />
    </Svg>
  )
}

export function InvestmentIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 17 9 11l4 4 8-8M21 7h-5m5 0v5" />
    </Svg>
  )
}

export function ReceiptIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
      <path d="M9 9h6M9 13h4" />
    </Svg>
  )
}

export function ChartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V10m5 10V4m5 16v-7m5 7V8M2 20h20" />
    </Svg>
  )
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4m0 3h.01" />
    </Svg>
  )
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m14 6-6 6 6 6" />
    </Svg>
  )
}
