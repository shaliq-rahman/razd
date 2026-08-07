export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="surface-card animate-rise rounded-[30px] px-6 py-11 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(109,75,246,0.08)]">
        {icon}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-[#24202a]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[28ch] text-sm leading-relaxed text-[#777180]">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
