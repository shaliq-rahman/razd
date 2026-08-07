/**
 * Adds rupee amounts in integer paise so repeated float addition cannot drift.
 * Every total shown in the UI goes through this.
 */
export function sumAmounts(values: number[]): number {
  const paise = values.reduce((acc, v) => acc + Math.round(v * 100), 0)
  return paise / 100
}
