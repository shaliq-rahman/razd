import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 h-[72px] w-[72px] overflow-hidden rounded-[24px] shadow-[0_18px_35px_-16px_rgba(29,26,36,0.5)] ring-1 ring-black/5">
            <Image
              src="/razd-app-icon.png"
              alt="Razd app icon"
              width={72}
              height={72}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-2xl font-black tracking-[-0.04em] text-[#211d27]">
            Razd <span className="text-emerald-600" dir="rtl" lang="ar">رصد</span>
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[#8a8390] uppercase">
            Money, clearly tracked
          </p>
        </div>
        <div className="surface-card animate-rise rounded-[12px] p-7 shadow-[0_24px_60px_-32px_rgba(28,24,38,0.5)]">{children}</div>
      </div>
    </div>
  )
}
