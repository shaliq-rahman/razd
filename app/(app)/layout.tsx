import { BottomNav } from '@/components/bottom-nav'

/**
 * The phone frame. On a handset it fills the screen; from `sm` up it becomes a
 * centered 480px column with rounded corners so a laptop shows an app, not a
 * stretched web page.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="app-frame relative mx-auto w-full max-w-[480px] flex-1 sm:my-5 sm:h-[calc(100dvh-2.5rem)] sm:flex-none">
      <div className="app-surface min-h-full sm:h-full sm:overflow-hidden sm:rounded-[42px] sm:border sm:border-white/75 sm:shadow-[0_36px_100px_-34px_rgba(30,26,42,0.5)]">
        <main className="app-content px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))] sm:h-full sm:overflow-y-auto sm:px-6 sm:pb-36">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
