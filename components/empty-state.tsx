/**
 * An empty screen is still a screen. `art` takes a full illustration scene;
 * `icon` remains for the compact inline cases that only need a glyph.
 */
export function EmptyState({
  icon,
  art,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode
  art?: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div
      className={`surface-card animate-rise relative overflow-hidden rounded-[13px] px-6 text-center ${
        art ? 'py-7' : 'py-6'
      }`}
    >
      {/* Faint bloom so the panel is not an empty white box. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-400/25 to-teal-300/20 blur-3xl"
      />

      {art ? (
        <div className="animate-pop relative mx-auto mb-4 flex justify-center">{art}</div>
      ) : (
        <div className="animate-pop relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[13px] bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(109,75,246,0.08)]">
          {icon}
        </div>
      )}

      <h3 className="relative text-lg font-bold tracking-tight text-[color:var(--text-strong)]">
        {title}
      </h3>
      <p className="relative mx-auto mt-1.5 max-w-[30ch] text-sm leading-relaxed text-[color:var(--text-muted)]">
        {body}
      </p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  )
}
