import { BottomNav } from '@/components/bottom-nav'

/**
 * The phone frame. On a handset it fills the screen; from `sm` up it becomes a
 * centered 480px column with rounded corners so a laptop shows an app, not a
 * stretched web page.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="app-surface relative mx-auto w-full max-w-[480px] flex-1 sm:my-5 sm:h-[calc(100dvh-2.5rem)] sm:flex-none sm:overflow-hidden sm:rounded-[42px] sm:border-2 sm:border-[#191919] sm:shadow-[8px_8px_0_#191919]">
      <main className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-36 sm:h-full sm:overflow-y-auto sm:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
