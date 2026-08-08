import { WalletIcon } from '@/components/icons'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[13px] bg-[#1d1a24] text-white shadow-[0_18px_35px_-16px_rgba(29,26,36,0.65)]">
            <WalletIcon className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold tracking-[0.24em] text-[#5f5968] uppercase">Razd</p>
        </div>
        <div className="surface-card animate-rise rounded-[12px] p-7 shadow-[0_24px_60px_-32px_rgba(28,24,38,0.5)]">{children}</div>
      </div>
    </div>
  )
}
