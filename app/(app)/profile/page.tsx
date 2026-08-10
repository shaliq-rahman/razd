import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { ProfileForm } from './profile-form'
import { ChartIcon } from '@/components/icons'
import { focusRing } from '@/lib/ui'
import { ResetDataCard } from './reset-data-card'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const [claimsResult, profileResult] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('profiles').select('display_name, currency').maybeSingle(),
  ])
  const profile = profileResult.data
  const email = typeof claimsResult.data?.claims.email === 'string'
    ? claimsResult.data.claims.email
    : undefined

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <p className="eyebrow mb-1">Personal space</p>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.035em] text-[#1d1a24]">Profile</h1>
      </header>

      <section className="surface-card animate-rise rounded-[13px] px-4 py-3.5">
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </section>

      <section className="surface-card animate-rise rounded-[13px] px-4 py-3.5 [animation-delay:70ms]">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Email</dt>
            <dd className="truncate font-medium text-slate-900">{email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Currency</dt>
            <dd className="font-medium text-slate-900">{profile?.currency ?? 'INR'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <p className="eyebrow mb-2 px-1">Insights</p>
        <Link href="/stats" className={`surface-card flex min-h-[76px] items-center gap-3 rounded-[24px] px-4 transition hover:-translate-y-0.5 ${focusRing}`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-violet-100 text-violet-700">
            <ChartIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[#29242f]">Spending statistics</span>
            <span className="mt-0.5 block text-xs text-[color:var(--text-muted)]">Monthly category breakdown and trends</span>
          </span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#9a949f]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </Link>
      </section>

      <section>
        <p className="eyebrow mb-2 px-1">Data controls</p>
        <ResetDataCard />
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="min-h-[48px] w-full cursor-pointer rounded-[14px] border border-rose-300 bg-rose-50 font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
