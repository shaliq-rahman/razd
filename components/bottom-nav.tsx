'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  { href: '/recurring', label: 'Bills', icon: 'M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5ZM9 10h6M9 14h4' },
  {
    href: '/profile',
    label: 'Profile',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/profile') return pathname.startsWith('/profile') || pathname.startsWith('/stats')
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingRoute, setPendingRoute] = useState<{ href: string; from: string } | null>(null)

  // All app pages are personalized Server Components. Warm their complete RSC
  // payloads as soon as the persistent navigation mounts so the first tap does
  // not have to wait for Supabase. Add is intentionally first because it has
  // the largest payload (accounts, categories, and recurring payments).
  useEffect(() => {
    const routes = ['/add', '/accounts', '/recurring', '/profile', '/'] as const
    routes.forEach((route) => router.prefetch(route))
  }, [router])

  // The optimistic route is valid only while the original pathname is still
  // committed. Once navigation lands, the real pathname takes over without an
  // extra state-setting render.
  const visiblePath = pendingRoute?.from === pathname ? pendingRoute.href : pathname

  return (
    <nav
      aria-label="Primary"
      className="glass-nav bottom-nav-fixed z-30 rounded-[34px]"
    >
      <ul className="flex h-[70px] items-center justify-around gap-1 px-2 py-1.5">
        {TABS.map((tab) => {
          const active = isActive(visiblePath, tab.href)

          if (tab.label === 'Add') {
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  prefetch={true}
                  onClick={() => setPendingRoute({ href: tab.href, from: pathname })}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex h-[54px] w-[54px] cursor-pointer items-center justify-center rounded-[26px] bg-[#1d1a24] text-white ring-1 ring-white/20 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-90 ${focusRing}`}
                  style={{
                    boxShadow: '0 10px 22px -10px rgba(29,26,36,0.75)',
                  }}
                >
                  {/* Light catching the top of the sphere. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-px rounded-[25px] bg-gradient-to-b from-white/16 to-transparent"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-6 w-6 transition-transform duration-300 group-active:rotate-90"
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
                prefetch={true}
                onClick={() => setPendingRoute({ href: tab.href, from: pathname })}
                aria-current={active ? 'page' : undefined}
                // min-h-[44px] keeps the tap area at the platform minimum even
                // though the icon and label are smaller than that.
                className={`relative flex min-h-[52px] w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[24px] transition-all duration-300 ${
                  active ? 'text-[#201d28]' : 'text-[color:var(--text-muted)] hover:text-[#302c38]'
                } ${focusRing}`}
              >
                {/* Soft pill behind the active tab, the way iOS marks selection. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-1 inset-y-0 -z-10 rounded-[24px] bg-white/76 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.9),0_4px_12px_-8px_rgba(28,24,38,0.35)] transition-all duration-300 ease-out ${
                    active ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                />
                <svg
                  viewBox="0 0 24 24"
                  className={`h-[21px] w-[21px] transition-transform duration-300 ${active ? '-translate-y-0.5' : ''}`}
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
