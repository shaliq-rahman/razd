import { describe, it, expect } from 'vitest'
import { credentialsSchema, accountSchema, transactionSchema } from './schemas'

describe('credentialsSchema', () => {
  it('accepts a valid email and password', () => {
    const r = credentialsSchema.safeParse({ email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejects a malformed email', () => {
    const r = credentialsSchema.safeParse({ email: 'not-an-email', password: 'secret12' })
    expect(r.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const r = credentialsSchema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(r.success).toBe(false)
  })
})

describe('accountSchema', () => {
  const valid = { name: 'HDFC', type: 'bank', opening_balance: '5000', color: '#5B8DEF' }

  it('coerces a numeric string opening balance', () => {
    const r = accountSchema.safeParse(valid)
    expect(r.success && r.data.opening_balance).toBe(5000)
  })

  it('allows a negative opening balance for an overdrawn card', () => {
    const r = accountSchema.safeParse({ ...valid, opening_balance: '-1200' })
    expect(r.success && r.data.opening_balance).toBe(-1200)
  })

  it('rejects an empty name', () => {
    expect(accountSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })

  it('rejects an unknown account type', () => {
    expect(accountSchema.safeParse({ ...valid, type: 'crypto' }).success).toBe(false)
  })

  it('rejects a non-numeric opening balance', () => {
    expect(accountSchema.safeParse({ ...valid, opening_balance: 'abc' }).success).toBe(false)
  })

  it('requires a limit and due day for card accounts', () => {
    expect(accountSchema.safeParse({ ...valid, type: 'card' }).success).toBe(false)
    expect(accountSchema.safeParse({
      ...valid,
      type: 'card',
      card_limit: '100000',
      due_day: '12',
    }).success).toBe(true)
  })
})

describe('transactionSchema', () => {
  // Real v4 UUIDs — the variant nibble must be 8/9/a/b, as gen_random_uuid() emits.
  const valid = {
    account_id: '9f1c2b3a-4d5e-4f60-9a71-2b3c4d5e6f70',
    category_id: 'a1b2c3d4-e5f6-4708-b91a-2c3d4e5f6071',
    amount: '500',
    kind: 'expense',
    occurred_at: '2026-08-07',
  }

  it('rejects a malformed account id', () => {
    expect(transactionSchema.safeParse({ ...valid, account_id: 'nope' }).success).toBe(false)
  })

  it('accepts a well-formed transaction', () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true)
  })

  it('treats an empty category as undefined rather than invalid', () => {
    const r = transactionSchema.safeParse({ ...valid, category_id: '' })
    expect(r.success && r.data.category_id).toBeUndefined()
  })

  it('rejects a zero amount', () => {
    expect(transactionSchema.safeParse({ ...valid, amount: '0' }).success).toBe(false)
  })

  it('rejects a negative amount, since kind carries the sign', () => {
    expect(transactionSchema.safeParse({ ...valid, amount: '-500' }).success).toBe(false)
  })

  it('rejects a malformed date', () => {
    expect(transactionSchema.safeParse({ ...valid, occurred_at: '07/08/2026' }).success).toBe(false)
  })
})
