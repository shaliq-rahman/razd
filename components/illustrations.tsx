/**
 * Empty-state illustrations.
 *
 * These are small scenes rather than icons: a few layered shapes with the
 * brand gradients, so an empty screen still looks composed. Each gradient id
 * is namespaced because several illustrations can share one page, and
 * duplicate ids would make one steal the other's fill.
 *
 * Everything is pure SVG — it scales, themes, and costs no network request.
 */
type Props = { className?: string }

function Scene({ className = 'h-32 w-32', children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

/** Soft blooms that sit behind every scene, echoing the app backdrop. */
function Aura({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-aura-a`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-aura-b`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="52" cy="54" r="46" fill={`url(#${id}-aura-a)`} />
      <circle cx="112" cy="98" r="42" fill={`url(#${id}-aura-b)`} />
    </>
  )
}

/** No accounts yet — a wallet with cards fanning out of it. */
export function WalletScene({ className }: Props) {
  const id = 'wallet'
  return (
    <Scene className={className}>
      <Aura id={id} />
      <defs>
        <linearGradient id={`${id}-card-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d3ff0" />
        </linearGradient>
        <linearGradient id={`${id}-card-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ece9f5" />
        </linearGradient>
      </defs>

      {/* Cards peeking above the wallet */}
      <rect
        x="46"
        y="34"
        width="62"
        height="40"
        rx="9"
        fill={`url(#${id}-card-b)`}
        transform="rotate(-9 77 54)"
      />
      <rect
        x="56"
        y="30"
        width="62"
        height="42"
        rx="9"
        fill={`url(#${id}-card-a)`}
        transform="rotate(6 87 51)"
      />

      {/* Wallet body */}
      <rect x="34" y="62" width="92" height="62" rx="18" fill={`url(#${id}-body)`} />
      <rect
        x="34"
        y="62"
        width="92"
        height="62"
        rx="18"
        stroke="#d9d4e6"
        strokeWidth="1.5"
      />
      {/* Clasp */}
      <rect x="92" y="84" width="38" height="20" rx="10" fill="#ffffff" stroke="#d9d4e6" strokeWidth="1.5" />
      <circle cx="105" cy="94" r="4.5" fill="#6d3ff0" />
    </Scene>
  )
}

/** Nothing logged yet — a receipt with a few lines and a coin. */
export function ReceiptScene({ className }: Props) {
  const id = 'receipt'
  return (
    <Scene className={className}>
      <Aura id={id} />
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1eef9" />
        </linearGradient>
        <linearGradient id={`${id}-coin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Receipt with a torn lower edge */}
      <path
        d="M46 34h58a6 6 0 0 1 6 6v76l-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5V40a6 6 0 0 1 6-6Z"
        fill={`url(#${id}-paper)`}
        stroke="#dcd7ea"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="58" y="52" width="34" height="5" rx="2.5" fill="#c9c2dd" />
      <rect x="58" y="66" width="46" height="5" rx="2.5" fill="#ded9ec" />
      <rect x="58" y="80" width="26" height="5" rx="2.5" fill="#ded9ec" />

      {/* Coin */}
      <circle cx="110" cy="104" r="20" fill={`url(#${id}-coin)`} />
      <circle cx="110" cy="104" r="20" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M110 95v18M105 100h8a4 4 0 0 1 0 8h-8"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Scene>
  )
}

/** No spending this month — a rising bar chart. */
export function ChartScene({ className }: Props) {
  const id = 'chart'
  return (
    <Scene className={className}>
      <Aura id={id} />
      <defs>
        <linearGradient id={`${id}-bar-a`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={`${id}-bar-b`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      <rect x="36" y="42" width="88" height="76" rx="16" fill="#ffffff" stroke="#dcd7ea" strokeWidth="1.5" />
      <rect x="52" y="82" width="14" height="22" rx="7" fill={`url(#${id}-bar-a)`} />
      <rect x="73" y="68" width="14" height="36" rx="7" fill={`url(#${id}-bar-b)`} />
      <rect x="94" y="56" width="14" height="48" rx="7" fill={`url(#${id}-bar-a)`} />
      <path
        d="M52 62 73 52l21 8 21-16"
        stroke="#6d3ff0"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="115" cy="44" r="5" fill="#6d3ff0" stroke="#ffffff" strokeWidth="2.5" />
    </Scene>
  )
}

/** No recurring payments — a calendar with a repeat marker. */
export function RepeatScene({ className }: Props) {
  const id = 'repeat'
  return (
    <Scene className={className}>
      <Aura id={id} />
      <defs>
        <linearGradient id={`${id}-page`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1eef9" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#5b2fe0" />
        </linearGradient>
      </defs>

      <rect x="34" y="40" width="92" height="84" rx="18" fill={`url(#${id}-page)`} stroke="#dcd7ea" strokeWidth="1.5" />
      <path d="M34 58a18 18 0 0 1 18-18h56a18 18 0 0 1 18 18v4H34Z" fill={`url(#${id}-band)`} />
      <circle cx="58" cy="82" r="5" fill="#ded9ec" />
      <circle cx="80" cy="82" r="5" fill="#ded9ec" />
      <circle cx="102" cy="82" r="5" fill="#ded9ec" />
      <circle cx="58" cy="102" r="5" fill="#ded9ec" />
      <circle cx="80" cy="102" r="7" fill="#6d3ff0" />
      <circle cx="102" cy="102" r="5" fill="#ded9ec" />
    </Scene>
  )
}
