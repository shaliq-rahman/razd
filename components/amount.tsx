import { formatSignedINR } from '@/lib/format'
import type { TxKind } from '@/lib/types'

export function Amount({ value, kind }: { value: number; kind: TxKind }) {
  return (
    <span
      className={`shrink-0 font-semibold tabular-nums ${
        kind === 'income' ? 'text-emerald-700' : 'text-slate-900'
      }`}
    >
      {formatSignedINR(value, kind)}
    </span>
  )
}
