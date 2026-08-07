'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { focusRing } from '@/lib/ui'

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: 'M3 7h18v12H3zM3 7l2-3h14l2 3M7 13h4',
  },
  { href: '/add', label: 'Add', icon: 'M12 5v14M5 12h14' },
  { href: '/stats', label: 'Stats', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  {
    href: '/profile',
    label: 'Profile',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  },
] as const

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    // Pinned to the viewport on a handset; docked inside the phone frame from
    // `sm` up, so the frame's rounded bottom stays visible on a laptop.
    <nav
      aria-label="Primary"
      className="glass-nav fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:absolute sm:left-0 sm:translate-x-0 sm:rounded-b-[36px]"
    >
      <ul className="flex items-end justify-around gap-1 px-2 pt-1.5 pb-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href)

          if (tab.label === 'Add') {
            return (
              <li key={tab.href} className="-mt-8">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex h-[58px] w-[58px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-600 text-white ring-[3px] ring-white/70 transition-transform duration-200 ease-out active:scale-90 ${focusRing}`}
                  style={{
                    boxShadow:
                      '0 6px 16px -4px rgba(79,70,229,0.5), 0 16px 32px -12px rgba(79,70,229,0.4)',
                  }}
                >
                  {/* Light catching the top of the sphere. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-7 w-7 transition-transform duration-200 group-active:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d={tab.icon} />
                  </svg>
                  <span className="sr-only">Add</span>
                </Link>
              </li>
            )
          }

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                // min-h-[44px] keeps the tap area at the platform minimum even
                // though the icon and label are smaller than that.
                className={`relative flex min-h-[44px] w-16 cursor-pointer flex-col items-center justify-center gap-[3px] rounded-2xl transition-colors duration-200 ${
                  active ? 'text-indigo-700' : 'text-slate-700'
                } ${focusRing}`}
              >
                {/* Soft pill behind the active tab, the way iOS marks selection. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-1 inset-y-0 -z-10 rounded-2xl bg-indigo-500/10 transition-all duration-300 ease-out ${
                    active ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                />
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px] transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.1 : 1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={tab.icon} />
                </svg>
                <span
                  className={`text-[11px] leading-none tracking-wide ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
