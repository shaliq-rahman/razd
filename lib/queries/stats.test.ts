import { describe, it, expect } from 'vitest'
import { aggregateByCategory } from './stats'

const row = (name: string, icon: string, amount: number) => ({
  amount,
  categories: { name, icon },
})

describe('aggregateByCategory', () => {
  it('returns an empty list for no rows', () => {
    expect(aggregateByCategory([])).toEqual([])
  })

  it('sums amounts within a category', () => {
    const result = aggregateByCategory([row('Food', '🍔', 200), row('Food', '🍔', 300)])
    expect(result).toEqual([{ name: 'Food', icon: '🍔', total: 500, share: 1 }])
  })

  it('sorts categories by total, largest first', () => {
    const result = aggregateByCategory([row('Food', '🍔', 100), row('Transport', '🚌', 400)])
    expect(result.map((r) => r.name)).toEqual(['Transport', 'Food'])
  })

  it('computes each share of the total spend', () => {
    const result = aggregateByCategory([row('Food', '🍔', 250), row('Bills', '🧾', 750)])
    expect(result[0].share).toBeCloseTo(0.75)
    expect(result[1].share).toBeCloseTo(0.25)
  })

  it('buckets uncategorised rows under Uncategorised', () => {
    const result = aggregateByCategory([{ amount: 100, categories: null }])
    expect(result[0].name).toBe('Uncategorised')
  })

  it('shares always sum to one', () => {
    const result = aggregateByCategory([
      row('A', '🍔', 33.33),
      row('B', '🚌', 33.33),
      row('C', '🧾', 33.34),
    ])
    expect(result.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1)
  })

  it('accepts numeric strings, as PostgREST returns for numeric columns', () => {
    const result = aggregateByCategory([
      { amount: '200.50' as unknown as number, categories: { name: 'Food', icon: '🍔' } },
    ])
    expect(result[0].total).toBe(200.5)
  })
})
