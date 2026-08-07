'use client'

import { useEffect } from 'react'

/** A bottom sheet: scrim tap, Escape, or the grabber's swipe area dismisses it. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
      />
      {/* Opaque, not translucent: the bottom nav sits behind the sheet and would
          otherwise read through the panel. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-in relative w-full max-w-[480px] rounded-t-[28px] border-t border-white/80 bg-white px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-20px_rgba(30,41,59,0.45)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-slate-300" />
        <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
        <div className="max-h-[70dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
