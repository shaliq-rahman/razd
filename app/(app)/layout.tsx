import { BottomNav } from '@/components/bottom-nav'

/**
 * The phone frame. On a handset it fills the screen; from `sm` up it becomes a
 * centered 480px column with rounded corners so a laptop shows an app, not a
 * stretched web page.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="relative mx-auto w-full max-w-[480px] flex-1 sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[36px] sm:border sm:border-white/70 sm:bg-white/30 sm:shadow-[0_30px_80px_-30px_rgba(30,41,59,0.4)]">
      <main className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">{children}</main>
      <BottomNav />
    </div>
  )
}
