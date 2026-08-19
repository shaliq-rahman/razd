/**
 * Icon set. Single visual language: 24px grid, 1.75 stroke, round caps and
 * joins, no fills. Emoji are not used for interface chrome — they render
 * differently per platform and cannot be themed or sized reliably.
 *
 * Category icons use the same vector language as the rest of the interface,
 * so they render consistently across iOS, Android, and desktop platforms.
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

/** A consistent vector for every built-in category, with a tag fallback. */
export function CategoryIcon({ name, className = 'h-5 w-5' }: IconProps & { name?: string | null }) {
  const category = name?.trim().toLowerCase()

  switch (category) {
    case 'food':
      return <Svg className={className}><path d="M7 3v7m-2-7v4a2 2 0 0 0 4 0V3M7 10v11M16 3v18m0-18c3 2 4 5 4 8h-4" /></Svg>
    case 'transport':
      return <Svg className={className}><rect x="4" y="3" width="16" height="16" rx="3" /><path d="M7 7h10M7 13h10M8 19v2m8-2v2M8 16h.01M16 16h.01" /></Svg>
    case 'shopping':
      return <Svg className={className}><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></Svg>
    case 'bills':
      return <ReceiptIcon className={className} />
    case 'health':
      return <Svg className={className}><path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 16.5 12 21 12 21Z" /><path d="M9 12h6m-3-3v6" /></Svg>
    case 'entertainment':
      return <Svg className={className}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></Svg>
    case 'salary':
      return <Svg className={className}><circle cx="9" cy="9" r="5" /><path d="M7 9h4M9 7v4m4 2a5 5 0 1 0 4-4" /></Svg>
    case 'diapers':
    case 'diaper':
      return <Svg className={className}><path d="M5 4v7c0 5 2.5 8 7 9 4.5-1 7-4 7-9V4l-4 3H9L5 4Z" /><path d="M5 11h4l3 3 3-3h4" /></Svg>
    case 'fruits':
    case 'fruit':
    case 'fruits & vegetables':
    case 'fruits and vegetables':
      return <Svg className={className}><path d="M12 8c-2-3-7-2-8 3-1 5 3 10 6 10 1 0 1.5-.6 2-.6s1 .6 2 .6c3 0 7-5 6-10-1-5-6-6-8-3Z" /><path d="M12 8c0-3 2-5 5-5M12 6c-2 0-3-1-4-3" /></Svg>
    case 'vegetables':
    case 'vegetable':
      return <Svg className={className}><path d="M8 8c3 0 6 1 8 3-1 5-3 8-6 10-2-4-3-8-2-13Z" /><path d="M9 8 6 4m3 4 1-5m-1 5 5-3m-4 7 4 3m-5 0 3 2" /></Svg>
    case 'other':
      return <Svg className={className}><path d="m12 3 1.4 4.1L18 8.5l-4.6 1.4L12 14l-1.4-4.1L6 8.5l4.6-1.4L12 3Z" /><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></Svg>
    case 'freelance':
      return <Svg className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></Svg>
    case 'lend':
      return <Svg className={className}><path d="M12 2v20M17 5H9.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 1 0 5H6" /></Svg>
    case 'fruits-veggies':
    case 'fruits & veggies':
      return <Svg className={className}><path d="M12 8c-2-3-7-2-8 3-1 5 3 10 6 10 1 0 1.5-.6 2-.6s1 .6 2 .6c3 0 7-5 6-10-1-5-6-6-8-3Z" /><path d="M12 8c0-3 2-5 5-5M12 6c-2 0-3-1-4-3" /></Svg>
    case 'sweets':
      return <Svg className={className}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><path d="M4 7h16l-2 13H6L4 7Z" /></Svg>
    case 'bakery':
      return <Svg className={className}><path d="M4 12c0-4 3-8 8-8s8 4 8 8" /><path d="M3 12h18l-1.5 8h-15L3 12Z" /></Svg>
    case 'evening-tea':
    case 'evening tea':
      return <Svg className={className}><path d="M4 9h13a3 3 0 0 1 0 6h-1" /><path d="M4 9v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V9" /><path d="M7 4c0 1.5 1.5 1.5 1.5 3M11 4c0 1.5 1.5 1.5 1.5 3" /></Svg>
    case 'miscellaneous':
    case 'misc':
      return <Svg className={className}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Svg>
    case 'petrol':
    case 'fuel':
      return <Svg className={className}><path d="M4 21V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14" /><path d="M4 11h8M14 8l3 2v6a1.5 1.5 0 0 0 3 0v-4l-2-2M3 21h13" /></Svg>
    case 'gym':
    case 'fitness':
      return <Svg className={className}><path d="M4 8v8M20 8v8" /><path d="M2 10v4M22 10v4" /><path d="M7 12h10" /><path d="M4 8v8M20 8v8" /></Svg>
    case 'clothing':
    case 'clothes':
      return <Svg className={className}><path d="M8 4 4 7l2 3 2-1.5V20h8V8.5L18 10l2-3-4-3-2 2h-4L8 4Z" /></Svg>
    default:
      return <Svg className={className}><path d="M20 13 12 21l-9-9V4h8l9 9Z" /><path d="M7.5 8h.01" /></Svg>
  }
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m14 6-6 6 6 6" />
    </Svg>
  )
}
