import { WalletIcon } from '@/components/icons'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
            <WalletIcon className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold tracking-[0.2em] text-slate-600 uppercase">Razd</p>
        </div>
        <div className="glass rounded-[28px] p-7">{children}</div>
      </div>
    </div>
  )
}
