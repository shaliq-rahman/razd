'use client'

import { useEffect, useRef } from 'react'
import { focusRing } from '@/lib/ui'

/** A bottom sheet. Scrim tap or Escape dismisses it; focus is trapped inside. */
export function Sheet({
  open,
  onClose,
  title,
  scrollable = true,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  scrollable?: boolean
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return

      // Keep Tab inside the sheet while it is modal.
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panel?.querySelector<HTMLElement>('input, button, select')?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 cursor-pointer bg-[#17141e]/55 backdrop-blur-[4px]"
      />
      {/* Opaque, not translucent: the bottom nav sits behind the sheet and would
          otherwise read through the panel. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-in relative w-full max-w-[480px] rounded-t-[34px] border-t border-white/90 bg-[#faf9f8] px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-24px_70px_-24px_rgba(25,21,34,0.55)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#c3bec8]" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-[#24202a]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`-mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-90 ${focusRing}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className={scrollable ? 'max-h-[70dvh] overflow-y-auto' : 'overflow-visible'}>
          {children}
        </div>
      </div>
    </div>
  )
}
