export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="glass rounded-3xl px-6 py-10 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-[28ch] text-sm text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
