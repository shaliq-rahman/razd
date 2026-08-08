/** Visual urgency for a card's currently utilized/outstanding amount. */
export function cardAlertClass(amount: number): string {
  if (amount >= 30_000) return 'card-alert card-alert-red'
  if (amount >= 20_000) return 'card-alert card-alert-orange'
  if (amount >= 10_000) return 'card-alert card-alert-yellow'
  return ''
}
