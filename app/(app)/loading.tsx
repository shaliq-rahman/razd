export default function Loading() {
  return (
    <div className="space-y-4 pt-2">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="h-40 animate-pulse rounded-[13px] bg-slate-200/60" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/60" />
        <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/60" />
      </div>
      <div className="h-56 animate-pulse rounded-[18px] bg-slate-200/50" />
    </div>
  )
}
