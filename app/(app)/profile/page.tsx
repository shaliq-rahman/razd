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

      <section className="glass rounded-3xl px-5 py-5">
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </section>

      <section className="glass rounded-3xl px-5 py-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="truncate font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Currency</dt>
            <dd className="font-medium text-slate-900">{profile?.currency ?? 'INR'}</dd>
          </div>
        </dl>
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3.5 font-semibold text-rose-600 transition active:scale-[0.98]"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
