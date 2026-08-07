import { createServerSupabase } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, currency')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>

      <section className="glass glass-lit animate-rise rounded-3xl px-5 py-5">
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </section>

      <section className="glass glass-lit animate-rise rounded-3xl px-5 py-4 [animation-delay:70ms]">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Email</dt>
            <dd className="truncate font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Currency</dt>
            <dd className="font-medium text-slate-900">{profile?.currency ?? 'INR'}</dd>
          </div>
        </dl>
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="min-h-[48px] w-full cursor-pointer rounded-2xl border border-rose-300 bg-rose-50 font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
