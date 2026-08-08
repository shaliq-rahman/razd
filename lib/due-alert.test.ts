import { describe, expect, it } from 'vitest'
import { dueAlertClass, dueUrgency } from './due-alert'

describe('due date urgency', () => {
  const today = '2026-08-08'

  it('marks passed dates red and overdue', () => {
    expect(dueUrgency('2026-08-07', today)).toBe('overdue')
    expect(dueAlertClass('2026-08-07', today)).toContain('due-alert-red')
  })

  it('marks dates within three days orange', () => {
    expect(dueUrgency('2026-08-11', today)).toBe('urgent')
    expect(dueAlertClass('2026-08-11', today)).toContain('due-alert-orange')
  })

  it('marks dates within seven days yellow', () => {
    expect(dueUrgency('2026-08-15', today)).toBe('soon')
    expect(dueAlertClass('2026-08-15', today)).toContain('due-alert-yellow')
  })

  it('does not alert for later dates', () => {
    expect(dueUrgency('2026-08-16', today)).toBe('normal')
    expect(dueAlertClass('2026-08-16', today)).toBe('')
  })
})
