'use client'

import { useFormStatus } from 'react-dom'
import { focusRing } from '@/lib/ui'

export function SubmitButton({
  children,
  pendingLabel = 'Please wait…',
}: {
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-[#1d1a24] py-3.5 font-semibold text-white shadow-[0_14px_26px_-14px_rgba(29,26,36,0.7)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#292530] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${focusRing}`}
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.3"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {pending ? pendingLabel : children}
    </button>
  )
}
